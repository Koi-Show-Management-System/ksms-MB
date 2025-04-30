import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export interface OrderItem {
  ticketTypeId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  listOrder: OrderItem[];
  fullName: string;
  email: string;
}

export interface PaymentResponse {
  url: string;
  orderId: string;
  signature?: string;
}

/**
 * Creates a ticket order and returns payment information
 */
export const createTicketOrder = async (orderData: CreateOrderRequest) => {
  try {
    const response = await api.post<{
      data: PaymentResponse;
      statusCode: number;
      message: string;
    }>("/api/v1/ticket-order/create-order", orderData);

    return response.data;
  } catch (error) {
    console.error("Payment error:", error);
    throw error;
  }
};

/**
 * Get payment URL for an existing order with pending status
 * @param orderId The ID of the pending order
 * @returns Payment URL response
 */
export const getOrderPaymentUrl = async (orderId: string) => {
  try {
    const response = await api.get<{
      data: PaymentResponse;
      statusCode: number;
      message: string;
    }>(`/api/v1/ticket-order/get-payment-url/${orderId}`);

    return response.data;
  } catch (error) {
    console.error("Get payment URL error:", error);
    throw error;
  }
};

/**
 * Get user information from AsyncStorage for payment
 */
export const getUserPaymentInfo = async () => {
  try {
    const fullName = (await AsyncStorage.getItem("userFullName")) || "User";
    const email =
      (await AsyncStorage.getItem("userEmail")) || "user@example.com";

    return { fullName, email };
  } catch (error) {
    console.error("Error getting user payment info:", error);
    return { fullName: "User", email: "user@example.com" };
  }
};
