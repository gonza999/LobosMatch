import { Platform } from 'react-native';

const fontFamily = Platform.select({
  web: 'System',
  default: undefined,
});

export default {
  h1: { fontSize: 32, fontWeight: '700', fontFamily },
  h2: { fontSize: 24, fontWeight: '700', fontFamily },
  h3: { fontSize: 20, fontWeight: '600', fontFamily },
  body: { fontSize: 16, fontWeight: '400', fontFamily },
  bodyBold: { fontSize: 16, fontWeight: '600', fontFamily },
  caption: { fontSize: 14, fontWeight: '400', fontFamily },
  captionBold: { fontSize: 14, fontWeight: '600', fontFamily },
  small: { fontSize: 12, fontWeight: '400', fontFamily },
  button: { fontSize: 16, fontWeight: '600', fontFamily },
};
