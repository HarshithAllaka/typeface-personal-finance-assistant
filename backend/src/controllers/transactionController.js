const Transaction = require('../models/Transaction');
const path = require('path');
const { extractTable } = require('../services/parseTablePdf');

// create new transaction
exports.create = async (req, res) => {
  try {
    const { type, amount, category = 'General', date, description = '' } = req.body;
    if (!type || !amount || !date) return res.status(400).json({ error: 'type, amount, and date required' });

    const txn = await Transaction.create({
      user: req.userId,
      type,
      amount,
      category,
      date,
      description,
      source: 'manual'
    });

    res.status(201).json(txn);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// list with filters + pagination
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, from, to, type } = req.query;
    const query = { user: req.userId };

    if (type) query.type = type;
    if (from || to) query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const txns = await Transaction.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Transaction.countDocuments(query);

    res.json({ items: txns, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// update
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

// delete
exports.remove = async (req, res) => {
  try {
    const result = await Transaction.deleteOne({ _id: req.params.id, user: req.userId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// analytics (by category & date)
exports.analytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { user: req.userId };
    if (from || to) match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);

    const byCategory = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: { category: "$category", type: "$type" }, total: { $sum: "$amount" } } },
      { $project: { _id: 0, category: "$_id.category", type: "$_id.type", total: 1 } }
    ]);

    const byDate = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: { d: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, type: "$type" }, total: { $sum: "$amount" } } },
      { $project: { _id: 0, date: "$_id.d", type: "$_id.type", total: 1 } },
      { $sort: { date: 1 } }
    ]);

    res.json({ byCategory, byDate });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.importPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf') return res.status(415).json({ error: 'Only PDF is supported' });

    const { rows, error } = await extractTable(req.file.path);
    if (error) return res.status(400).json({ error });

    if (!rows.length) return res.status(400).json({ error: 'No valid rows found in PDF' });

    // attach user id
    const docs = rows.map(r => ({ ...r, user: req.userId }));
    const result = await Transaction.insertMany(docs, { ordered: false });
    res.status(201).json({ inserted: result.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
