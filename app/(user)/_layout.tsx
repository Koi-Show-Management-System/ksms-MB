import { Stack } from "expo-router";
import React from "react";
import LayoutWithFooter from "../../components/LayoutWithFooter";

export default function userLayout() {
  return (
    <LayoutWithFooter>
      <Stack>
        <Stack.Screen name="KoiRegister" options={{ headerShown: false }} />
        <Stack.Screen name="KoiList" options={{ headerShown: false }} />
        <Stack.Screen name="Notification" options={{ headerShown: false }} />
        <Stack.Screen name="TicketCheckin" options={{ headerShown: false }} />
        <Stack.Screen name="CompetitionTicket" options={{ headerShown: false }} />
        <Stack.Screen name="Transactions" options={{ headerShown: false }} />
        <Stack.Screen name="UserProfile" options={{ headerShown: false }} />
        <Stack.Screen name="MyOrders" options={{ headerShown: false }} />
        <Stack.Screen name="CompetitionJoined" options={{ headerShown: false }} />
        <Stack.Screen name="OrderDetail" options={{ headerShown: false }} />
        <Stack.Screen name="TicketDetail" options={{ headerShown: false }} />
      </Stack>
    </LayoutWithFooter>
  );
}
