import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/db";

const MasterNumbers = sequelize.define("MasterNumbers", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
  },
  machineNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  machineName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn("now"),
  },
  created_by: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn("now"),
  },
  modified_by: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default MasterNumber;
