import PointRecord from "../model/transaction.js";

async function report() {
  try {
    const reportData = await PointRecord.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
    if (reportData) {
      res.status(200).json(reportData);
    } else {
      res.status(404).json({ message: "No data found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default report;
