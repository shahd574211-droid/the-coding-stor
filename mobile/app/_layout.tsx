import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "the coding stor" }} />
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="products/index" options={{ title: "Products" }} />
      <Stack.Screen name="products/[slug]" options={{ title: "Product" }} />
    </Stack>
  );
}
