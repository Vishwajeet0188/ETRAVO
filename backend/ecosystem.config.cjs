module.exports = {
  apps: [
    {
      name: "rideapp",
      script: "./src/server.js",
      instances: "max",
      exec_mode: "cluster",

      env: {
        NODE_ENV: "production",
        UV_THREADPOOL_SIZE: 16,
      },
    },
  ],
};