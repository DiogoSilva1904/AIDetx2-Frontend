const API_URL = import.meta.env.VITE_API_URL;

export const API = {
    async scanText(text: string, modelId: string, category: "ml" | "dl", windowMode:"words"|"chars") {
        const response = await fetch(`${API_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
            text, 
            model_type: category,  
            model_name: modelId, 
            window_type:windowMode,
        }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }
};
