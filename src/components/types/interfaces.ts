// src/types/interfaces.ts

export interface User {
  id: number;
  name: string;
  username: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  email: string;
  phone: string;
}

export interface FormField {
  value: string;
  isValid: boolean;
  isTouched: boolean;
}

export interface FormData {
  email: FormField;
  username: FormField;
  phoneNumber: FormField;
  name: FormField;
  address: FormField;
  city: FormField;
  zipCode: FormField;
  latitude: FormField;
  longitude: FormField;
}
