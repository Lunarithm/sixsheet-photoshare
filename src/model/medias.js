import {Sequelize, DataTypes} from "sequelize";
import sequelize from "../config/db";

const Medias = sequelize.define('Medias',
    {
        uuid: {
            type: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        source: {
            type: DataTypes.JSON,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: Sequelize.fn('now'),
        },
        created_by:{
            type: DataTypes.TEXT,
            allowNull: true
        },
        updatedAt:{
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: Sequelize.fn('now')
        },
        modified_by:{
            type: DataTypes.TEXT,
            allowNull: true
        },
        shortUUID: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        event: {
            type: DataTypes.JSON,
            allowNull: true
        }
    });
    
    export default Medias;