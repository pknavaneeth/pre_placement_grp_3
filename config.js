const config = {
  production: {
    SECRET: process.env.SECRET,
    DATABASE: process.env.MONGODB_URI,
  },
  default: {
    SECRET: "SECRET",
    //DATABASE: 'mongodb://localhost:27017/Users'
    DATABASE:
      "mongodb+srv://Wiley3:Learning%40123@cluster0.fs3uf.mongodb.net/Placement_Drive?authSource=admin&replicaSet=atlas-nbwcp1-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true",
  },
};

exports.get = function get(env) {
  return config[env] || config.default;
};
