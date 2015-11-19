import Colors from 'material-ui/lib/styles/colors';
import Spacing from 'material-ui/lib/styles/spacing';
import ColorManipulator from 'material-ui/lib/utils/color-manipulator';

export default {
 spacing:     Spacing,
 fontFamily:  'Roboto, sans-serif',
 palette: {
   primary1Color:       '#EF5350',
   primary2Color:       Colors.purple700,
   primary3Color:       Colors.lightBlack,
   accent1Color:        Colors.purpleA200,
   accent2Color:        Colors.grey100,
   accent3Color:        Colors.grey500,
   textColor:           Colors.darkBlack,
   alternateTextColor:  Colors.white,
   canvasColor:         Colors.white,
   borderColor:         Colors.grey300,
   disabledColor:       ColorManipulator.fade(Colors.darkBlack, 0.3),
 }
};
