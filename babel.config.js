module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          // public: './src/public',
          // services: './src/services',
          utils: './src/utils',
          roots: './src/roots',
          screen: './src/screen',
          components: './src/components',
        },
      },
    ],
  ],
};
