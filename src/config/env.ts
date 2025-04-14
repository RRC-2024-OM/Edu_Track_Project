export const validateEnv = () => {
    const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
  
    const missing = required.filter((key) => !process.env[key]);
  
    if (missing.length > 0) {
      console.error('Missing required environment variables: ${missing.join(', ')}');
      process.exit(1);
    }
  };
  