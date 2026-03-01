import { useEffect, useState } from 'react';

// The Firebase Project ID we are connecting to
const FIREBASE_PROJECT_ID = 'expense-app-4388c';

// The base REST API URL for Firestore
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export interface StoreProduct {
    id: string; // Document ID (usually auto-generated)
    categoryId: string;
    name: string;
    price: number;
    originalPrice?: number;
    icon: string;
    color: string;
    plans?: string[];
    // We attach the full category object here later for easy UI rendering
    categoryObj?: StoreCategory;
}

export interface StoreCategory {
    id: string; // Document ID (e.g., 'freelance', 'gaming', 'entertainment')
    title: string;
    order: number;
    items: StoreProduct[];
}

/**
 * Helper function to parse Firestore's verbose JSON structure into normal JS objects.
 * Firestore returns data like: { fields: { title: { stringValue: "Gaming" } } }
 */
const parseFirestoreDocument = (doc: any) => {
    const data: any = {};
    if (!doc.fields) return data;

    for (const [key, value] of Object.entries(doc.fields) as any) {
        if (value.stringValue !== undefined) data[key] = value.stringValue;
        else if (value.integerValue !== undefined) data[key] = parseInt(value.integerValue, 10);
        else if (value.doubleValue !== undefined) data[key] = parseFloat(value.doubleValue);
        else if (value.booleanValue !== undefined) data[key] = value.booleanValue;
        else if (value.arrayValue !== undefined) {
            // For arrays like plans: ["1 Month", "3 Month"]
            data[key] = value.arrayValue.values ? value.arrayValue.values.map((v: any) => v.stringValue || v.integerValue) : [];
        }
    }

    // Extract the Document ID from the full path (e.g. projects/.../documents/StoreCategories/gaming)
    const pathParts = doc.name.split('/');
    data.id = pathParts[pathParts.length - 1];

    return data;
};

export function useStoreProducts() {
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                // 1. Fetch Categories
                const catRes = await fetch(`${FIRESTORE_BASE_URL}/StoreCategories`);
                if (!catRes.ok) throw new Error(`Category Fetch Failed: ${catRes.status}`);
                const catData = await catRes.json();

                const parsedCats: StoreCategory[] = (catData.documents || []).map((doc: any) => ({
                    ...parseFirestoreDocument(doc),
                    items: [] // Initialize empty array
                }));

                // Sort categories by their defined 'order'
                parsedCats.sort((a, b) => (a.order || 0) - (b.order || 0));

                // 2. Fetch Products
                const prodRes = await fetch(`${FIRESTORE_BASE_URL}/StoreProducts`);
                if (!prodRes.ok) throw new Error(`Product Fetch Failed: ${prodRes.status}`);
                const prodData = await prodRes.json();

                const parsedProds: StoreProduct[] = (prodData.documents || []).map((doc: any) =>
                    parseFirestoreDocument(doc)
                );

                // 3. Merge products into categories
                const mappedCats = parsedCats.map(cat => {
                    const matchedItems = parsedProds.filter(p => p.categoryId === cat.id);
                    return {
                        ...cat,
                        items: matchedItems
                    };
                });

                if (isMounted) {
                    // Fallback to empty if absolutely nothing is created yet
                    setCategories(mappedCats);
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("Firebase REST Fetch Error:", err);
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Helper used by the product/[id].tsx detail screen
    const getProductById = (id: string) => {
        for (const cat of categories) {
            const found = cat.items.find(i => i.id === id);
            if (found) return { ...found, categoryObj: cat };
        }
        return null;
    };

    return { categories, loading, error, getProductById };
}
