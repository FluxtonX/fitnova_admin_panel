const API_KEY = "AIzaSyBuhx148XDOHGS_TQipCkoxs2tl0cD5dx8";
const PROJECT_ID = "fitnovva";

async function createAdmin() {
  try {
    console.log("Creating user via REST API...");
    
    // 1. Create User
    const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@fitnova.com",
        password: "admin123",
        returnSecureToken: true
      })
    });
    
    const signUpData = await signUpRes.json();
    
    if (signUpData.error) {
      if (signUpData.error.message === "EMAIL_EXISTS") {
         console.log("User already exists. Skipping creation, but we will try to update Firestore anyway.");
      } else {
         throw new Error(signUpData.error.message);
      }
    }
    
    let uid = signUpData.localId;
    let token = signUpData.idToken;
    
    if (!uid) {
      console.log("Signing in to get UID...");
      const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@fitnova.com",
          password: "admin123",
          returnSecureToken: true
        })
      });
      const signInData = await signInRes.json();
      uid = signInData.localId;
      token = signInData.idToken;
    }

    console.log("UID is:", uid);
    console.log("Writing admin role to Firestore via REST API...");
    
    // 2. Write to Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
    
    const docData = {
      fields: {
        email: { stringValue: "admin@fitnova.com" },
        role: { stringValue: "admin" },
        status: { stringValue: "active" },
        createdAt: { stringValue: new Date().toISOString() }
      }
    };
    
    const fsRes = await fetch(firestoreUrl, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(docData)
    });
    
    const fsData = await fsRes.json();
    if (fsData.error) {
       console.error("Firestore Error:", fsData.error);
       throw new Error("Failed to write to Firestore");
    }
    
    console.log("Successfully created admin user and assigned role in Firestore!");

  } catch (err) {
    console.error("Error:", err);
  }
}

createAdmin();
