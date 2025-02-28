import Url from './url';

// Initialize models
const models = {
  Url,
};

// Sync all models with the database
const syncModels = async () => {
  try {
    await Promise.all(
      Object.values(models).map(model => model === Url && model.sync())
    );
    console.log('Models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

// Call this when you need to sync models (on app startup)
syncModels();

export { Url };
export default models; 