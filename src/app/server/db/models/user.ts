import { LocationInfo, UserRoles } from '@/app/types';
import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UserAttributes {
  id: string;
  username: string;
  session_id: string;
  role: UserRoles;
  location?: LocationInfo | null;
  created_at: Date;
  updated_at?: Date | null;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'location' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  static associate(models: any) {
    // A user belongs to a session
    User.belongsTo(models.Session, { foreignKey: 'session_id', as: 'session' });
  }
}

export default function (sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'sessions',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [['initiator', 'participant']],
        },
      },
      // {lat, lng, source: 'manual', updated_at}
      location: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return User;
}
