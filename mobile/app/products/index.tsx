import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { getProducts, type ProductListItem } from "@/lib/api";

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts({ limit: 24 })
      .then(({ products: p, total: t }) => {
        setProducts(p);
        setTotal(t);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/products/${item.slug}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.imageWrap}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No image</Text>
                  </View>
                )}
              </View>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 12 },
  list: { paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  imageWrap: { aspectRatio: 1, backgroundColor: "#f5f5f5" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#999", fontSize: 12 },
  name: { padding: 8, fontSize: 14, fontWeight: "500" },
  price: { paddingHorizontal: 8, paddingBottom: 8, fontSize: 14, fontWeight: "600" },
  error: { color: "#b91c1c" },
});
