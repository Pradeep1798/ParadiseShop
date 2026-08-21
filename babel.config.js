module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          public: './src/public',
          views: './src/views',
          services: './src/services',
          utils: './src/utils',
        },
      },
    ],
  ],
};