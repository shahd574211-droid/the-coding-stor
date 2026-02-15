import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getProduct, type ProductDetail } from "@/lib/api";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getProduct(slug)
      .then(setProduct)
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        {product.category && (
          <Text style={styles.category}>{product.category.name}</Text>
        )}
        <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
        {product.shortDescription ? (
          <Text style={styles.description}>{product.shortDescription}</Text>
        ) : null}
        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}
        {product.type === "DIGITAL" && product.digitalAssets?.length > 0 && (
          <Text style={styles.digitalNote}>Download available after purchase.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  imageWrap: { aspectRatio: 1, backgroundColor: "#f5f5f5" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 },
  placeholderText: { color: "#999" },
  body: { padding: 16 },
  name: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  category: { fontSize: 14, color: "#666", marginBottom: 8 },
  price: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, color: "#444" },
  digitalNote: { marginTop: 12, fontSize: 14, color: "#666" },
  error: { color: "#b91c1c" },
});
