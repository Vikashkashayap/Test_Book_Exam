import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  role: string;
  resource: string;
  actions: string[];
}

const PermissionSchema = new Schema<IPermission>(
  {
    role: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    actions: [{ type: String }],
  },
  { timestamps: true }
);

PermissionSchema.index({ role: 1, resource: 1 }, { unique: true });

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
