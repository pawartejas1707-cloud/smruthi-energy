import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n⚠️ [MongoDB Notice]: MONGODB_URI environment variable is not defined.');
    console.warn('   The server will run in fallback demo mode. To connect to MongoDB Atlas (Free M0):');
    console.warn('   Set MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/smruthi_energy?retryWrites=true&w=majority\n');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ [MongoDB Atlas Connected]: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ [MongoDB Connection Error]:', error);
    return false;
  }
}
