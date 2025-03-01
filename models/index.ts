import Url from './url';
import Log from './log';

// Initialize models
const models = {
  Url,
  Log,
};

// Sync all models with the database
const syncModels = async () => {
  try {
    await Promise.all(
      Object.values(models).map(model => (model === Url || model === Log) && model.sync())
    );
    console.log('Models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

// Call this when you need to sync models (on app startup)
syncModels();

export { Url, Log };
export default models; 