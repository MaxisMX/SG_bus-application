/**
 * Manual mock for @expo/vector-icons.
 *
 * The real package pulls in expo-font and expo-asset, which need a
 * native font renderer that does not exist in a test environment.
 *
 * Jest picks this up automatically for any test importing the package,
 * with no jest.mock() call needed.
 *
 * Icons render as nothing: they are decorative, and the surrounding
 * Pressable carries the accessibility label that tests assert on.
 */

const Icon = () => null;

module.exports = {
  Ionicons: Icon,
  MaterialIcons: Icon,
  MaterialCommunityIcons: Icon,
  FontAwesome: Icon,
  FontAwesome5: Icon,
  AntDesign: Icon,
  Feather: Icon,
  Entypo: Icon,
  EvilIcons: Icon,
  Fontisto: Icon,
  Foundation: Icon,
  Octicons: Icon,
  SimpleLineIcons: Icon,
  Zocial: Icon,
  createIconSet: () => Icon,
};
