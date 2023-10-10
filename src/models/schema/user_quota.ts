import Sequelize, { Model, ModelAttributes } from 'sequelize';
import { sequelize, Defaultconfig } from '../db-config';

const UserQuotaSchema: ModelAttributes = {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: Sequelize.STRING(36),
    },
    quota: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    create_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    update_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
};

class UserQuota extends Model {
    public id!: number;
    public user_id!: string;
    public quota!: number;
    public create_time!: Date;
    public update_time!: Date;
}

UserQuota.init(UserQuotaSchema, {
    ...Defaultconfig,
    sequelize,
    modelName: 'user_quota',
});

export default UserQuota;
