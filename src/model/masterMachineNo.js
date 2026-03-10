import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/db";

const Machines = sequelize.define("Machines", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
  },
  machineNo: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  machineName: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn("now"),
  },
  createdBy: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn("now"),
  },
  updatedBy: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

export default Machines;
