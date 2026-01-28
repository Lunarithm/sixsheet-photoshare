import {Sequelize, DataTypes} from "sequelize";
import sequelize from "../config/db";

const PointRecord = sequelize.define(
  "PointTransaction",
  {
    tId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phoneNo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    machineNo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fullAmount: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    discountAmount: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: true,
    },
    paymentType: {
      type: DataTypes.ENUM,
      allowNull: true,
      values: ["DP", "CC", "CT"],
    },
    isCoupon: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    couponCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    couponType: {
      type: DataTypes.ENUM,
      allowNull: true,
      values: ["NONE", "DC", "FREE"],
    },
    isManually: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
      type: DataTypes.DATE,
    },
    isreprinted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    copies: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    transactionId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    hooks: {
      async afterCreate(record) {
        try {
          const isAddPoint = record.dataValues.isCoupon
            ? record.dataValues.couponType == "DC"
            : true;
          if (isAddPoint) {
            //Find One
            const isExist = await Membership.findOne({
              where: { phoneNo: record.dataValues.phoneNo },
            });
            if (isExist) {
              // Update
              if (!record.dataValues.isManually) {
                await Membership.increment(["point"], {
                  where: { phoneNo: record.dataValues.phoneNo },
                });
              }
            } else {
              // Insert
              await Membership.create({
                uuid: record.dataValues.tId,
                phoneNo: record.dataValues.phoneNo,
                point: 1,
              });
            }
          }
        } catch (err) {
          console.log("i", err);
        }
      },
    },
  }
);

export default PointRecord;
