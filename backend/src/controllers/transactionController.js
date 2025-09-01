// backend/src/controllers/transactionController.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const { extractTable } = require('../services/parseTablePdf');

async function writeTemp(buffer, ext = '.pdf') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'finsight-imp-'));
  const filePath = path.join(dir, `import${ext}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

// ───────────────────────────────────────────────────────────────────────────────
// Create
// ───────────────────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { type, amount, category = 'General', date, description = '' } = req.body;
    if (!type || !amount || !date) {
      return res.status(400).json({ error: 'type, amount, and date required' });
    }

    const txn = await Transaction.create({
      user: req.userId,
      type,
      amount,
      category,
      date,
      description,
      source: 'manual',
    });

    res.status(201).json(txn);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// List with filters + pagination
// ───────────────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, from, to, type } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const query = { user: req.userId };
    if (type) query.type = type;

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const skip = (p - 1) * lim;

    const [items, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1, _id: -1 }).skip(skip).limit(lim),
      Transaction.countDocuments(query),
    ]);

    res.json({ items, total, page: p, pages: Math.ceil(total / lim) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// Update
// ───────────────────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!txn) return res.status(404).json({ error: 'Not found' });
    res.json(txn);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// Delete
// ───────────────────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const result = await Transaction.deleteOne({ _id: req.params.id, user: req.userId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// Analytics
// ───────────────────────────────────────────────────────────────────────────────
exports.analytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const match = { user: userObjectId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    const byCategory = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' } } },
      { $project: { _id: 0, category: '$_id.category', type: '$_id.type', total: 1 } },
      { $sort: { category: 1, type: 1 } },
    ]);

    const byDate = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $project: { _id: 0, date: '$_id.d', type: '$_id.type', total: 1 } },
      { $sort: { date: 1 } },
    ]);

    res.json({ byCategory, byDate });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
exports.importPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { buffer, originalname = '' } = req.file;
    const ext = path.extname(originalname).toLowerCase() || '.pdf';
    if (ext !== '.pdf') return res.status(415).json({ error: 'Only PDF is supported' });

    let tmpPath;
    try {
      // extractTable expects a path → write temp
      tmpPath = await writeTemp(buffer, '.pdf');

      const { rows, error } = await extractTable(tmpPath);
      if (error) return res.status(400).json({ error });
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No valid rows found in PDF' });
      }

      const docs = rows.map(r => ({ ...r, user: req.userId }));
      const result = await Transaction.insertMany(docs, { ordered: false });

      res.status(201).json({ inserted: result.length });
    } finally {
      if (tmpPath) {
        try { await fs.rm(path.dirname(tmpPath), { recursive: true, force: true }); } catch {}
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
exports.summary = async (req, res) => {
  try {
    const user = req.userId;

    const buckets = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(user) } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    let totalIncome = 0, totalExpense = 0;
    for (const b of buckets) {
      if (b._id === 'income') totalIncome = b.total;
      if (b._id === 'expense') totalExpense = b.total;
    }

    const recent = await Transaction.find({ user })
      .sort({ date: -1, _id: -1 })
      .limit(5)
      .lean();

    res.json({
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      recent,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
