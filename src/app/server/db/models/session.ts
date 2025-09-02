import { LocationInfo } from '@/app/types';
import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface SessionAttributes {
  id: string;
  status: 'active' | 'ended';
  created_at: Date;
  computed_location?: LocationInfo | null;
  override_location?: LocationInfo | null;
  invite_token: string;
  ended_at?: Date | null;
  created_by: string;
  updated_at?: Date | null;
}

export interface SessionCreationAttributes
  extends Optional<
    SessionAttributes,
    'id' | 'ended_at' | 'computed_location' | 'override_location' | 'updated_at'
  > {}

export class Session extends Model<SessionAttributes, SessionCreationAttributes> {
  static associate(models: any) {
    // A session is created by one user
    Session.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  }
}

export default function (sequelize: Sequelize) {
  Session.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [['active', 'ended']],
        },
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      ended_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // {lat, lng, source: 'computed', updated_at}
      computed_location: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // {lat, lng, source: 'manual', updated_at}
      override_location: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      invite_token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'sessions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Session;
}
