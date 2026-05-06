import { View, TouchableOpacity, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const tabs = [
  { name: 'dashboard', icon: 'home-outline', activeIcon: 'home' },
  { name: 'penyimpanan', icon: 'folder-outline', activeIcon: 'folder' },
  { name: 'input-file', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  { name: 'profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function CustomTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions();
  
  const TAB_WIDTH = width * 0.9;
  const ITEM_WIDTH = TAB_WIDTH / tabs.length;

  // --- LOGIKA PENENTUAN INDEX AKTIF ---
  const getActiveIndex = () => {
    const currentRouteName = state.routes[state.index].name;
    
    // Jika user sedang di page 'checklist', paksa index ke 1 (Penyimpanan)
    if (currentRouteName === 'checklist') {
      return 1; 
    }
    
    // Cari index berdasarkan nama route yang terdaftar di array tabs
    const index = tabs.findIndex(tab => tab.name === currentRouteName);
    return index !== -1 ? index : state.index;
  };

  const activeIndex = getActiveIndex();
  const transition = useSharedValue(activeIndex);

  useEffect(() => {
    transition.value = withSpring(activeIndex, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });
  }, [activeIndex]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: transition.value * ITEM_WIDTH },
        { scaleX: interpolate(transition.value, [activeIndex - 0.5, activeIndex, activeIndex + 0.5], [1.1, 1, 1.1]) }
      ],
    };
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: TAB_WIDTH }]}>
        
        {/* BULATAN INDICATOR */}
        <Animated.View style={[
          styles.circleWrapper, 
          { width: ITEM_WIDTH }, 
          animatedCircleStyle
        ]}>
          <View style={styles.circle} />
        </Animated.View>

        {/* TAB ITEMS */}
        {tabs.map((tab, index) => {
          return (
            <TouchableOpacity
              key={index}
              style={styles.tab}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={1}
            >
              <TabIcon 
                index={index} 
                activeIndex={transition} 
                icon={tab.icon} 
                activeIcon={tab.activeIcon}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ index, activeIndex, icon, activeIcon }: any) {
  const animatedIconStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [0, -28, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [1, 1.2, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity: interpolate(
        activeIndex.value,
        [index - 1, index, index + 1],
        [0.6, 1, 0.6],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <Animated.View style={animatedIconStyle}>
      <Ionicons
        name={(Math.round(activeIndex.value) === index ? activeIcon : icon) as any}
        size={24}
        color="#fff"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    alignItems: 'center',
  },
  container: {
    height: 70,
    backgroundColor: '#FF8C2B',
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  circleWrapper: {
    position: 'absolute',
    top: -25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5A2D0C',
    borderWidth: 5,
    borderColor: '#fff',
    elevation: 4,
  },
});