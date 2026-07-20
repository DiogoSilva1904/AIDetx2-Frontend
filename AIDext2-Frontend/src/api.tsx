/* //import { predictText } from "./services/localInference";

const API_URL = import.meta.env.VITE_API_URL;

/* export const API = {
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
 */

const API_URL = import.meta.env.VITE_API_URL;

export const API = {

async scanText(
    text:string,
    modelId:string,
    category:"ml"|"dl",
    windowMode:"words"|"chars"
){

    if(category === "dl"){

        return 0;

    }


    const response = await fetch(
        `${API_URL}/predict`,
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                text,
                model_type:category,
                model_name:modelId,
                window_type:windowMode
            })
        }
    );


    return response.json();
},

scanFile: async (
    file: File,
    modelId: string,
    category: string,
    windowMode: string
): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_type", category);
    formData.append("model_name", modelId);
    formData.append("window_type", windowMode);

    const res = await fetch(`${API_URL}/predict-file`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Failed to scan file");
    }

    return res.json();
},

extractText: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/extract-text`, {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    return data.text;
},

};