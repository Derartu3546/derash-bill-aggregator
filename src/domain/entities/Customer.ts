export interface CustomerProps {
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer {
  public readonly id?: string;
  public fullName?: string;
  public phoneNumber?: string;
  public email?: string;
  public isActive: boolean = true;
  public readonly createdAt?: Date;
  public updatedAt?: Date;

  constructor(props: CustomerProps) {
    if (!props.fullName || props.fullName.trim().length === 0) {
      throw new Error("Customer name is required");
    }

    if (!props.phoneNumber || props.phoneNumber.trim().length === 0) {
      throw new Error("Customer phone number is required");
    }

    this.id = props.id;
    this.fullName = props.fullName;
    this.phoneNumber = props.phoneNumber;
    this.email = props.email;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  
  deactivate() {
    this.isActive = false;
  }

  updateName(newName: string) {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Customer name cannot be empty");
    }
    this.fullName = newName;
  }
}