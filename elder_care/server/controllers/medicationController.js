const Medication = require('../models/Medication');

// 添加用药计划
exports.addMedication = async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    
    res.json({
      success: true,
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取今日用药计划
exports.getTodayMedications = async (req, res) => {
  try {
    const { userId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const medications = await Medication.find({
      userId,
      startDate: { $lte: today },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: today } }
      ]
    });
    
    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 标记用药已服用
exports.markTaken = async (req, res) => {
  try {
    const { medicationId, scheduleIndex } = req.body;
    
    const medication = await Medication.findById(medicationId);
    if (!medication) {
      throw new Error('Medication not found');
    }
    
    medication.schedule[scheduleIndex].taken = true;
    medication.schedule[scheduleIndex].timestamp = new Date();
    await medication.save();
    
    res.json({
      success: true,
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 