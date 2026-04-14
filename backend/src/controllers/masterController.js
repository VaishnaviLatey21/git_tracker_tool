const { MODULE_LIST } = require("../constants/masterData");

exports.getMasterModules = async (req, res) => {
  try {
    res.json(MODULE_LIST);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
