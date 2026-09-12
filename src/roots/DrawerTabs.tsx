import React from 'react';

import {
  View,
  Text,
  ImageBackground,
  Pressable,
  StyleSheet,
} from 'react-native';

import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';

import Ionicons, {
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';

import Home from 'screen/Home/Home';
import Stock from 'screen/products/Stock';
import Expense from 'screen/products/expense';
import Bills from 'screen/products/Bills';
import DailyReports from 'screen/reports/dailyReports';
import Needs from 'screen/products/Needs';
import WeeklyReport from 'screen/reports/weeklyreports';
import PriceList from 'screen/priceList/PriceList';
import Notifications from 'screen/notification/notications';
import CloseBill from 'screen/closeBill/CloseBill';
import Catalogue from 'screen/catalogue/Catalogue';

import { SCREENS, TABSCREENS } from './RootStack';
import { clearDeviceSession } from 'utils/HelperFn';
import Attendance from 'screen/reports/Attendance';

const Drawer = createDrawerNavigator();

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  chocolate: '#3A1708',
  chocolateDark: '#260C03',

  gold: '#C47A26',
  goldLight: '#E5A84F',

  cream: '#FFF9F0',
  creamActive: '#F4E1C8',

  text: '#191411',
  chocolateText: '#65361F',

  section: '#6B3820',

  arrow: '#B96D27',

  border: '#E3CDB6',

  switchBackground: '#FBE7EC',
  switchText: '#C21858',
};

/* =========================================================
   WITH PARAMS
========================================================= */

const withParams = (Component: any, params: any) => (props: any) =>
  (
    <Component
      {...props}
      route={{
        ...props.route,
        params,
      }}
    />
  );

/* =========================================================
   DRAWER MENU ITEM
========================================================= */

type DrawerMenuItemProps = {
  label: string;
  icon: IoniconsIconName;
  screen: string;
  navigation: any;
  state: any;
};

const DrawerMenuItem = ({
  label,
  icon,
  screen,
  navigation,
  state,
}: DrawerMenuItemProps) => {
  const currentRoute = state.routes[state.index];

  const isActive = currentRoute.name === screen;

  return (
    <Pressable
      onPress={() => navigation.navigate(screen)}
      style={({ pressed }) => [
        styles.menuItem,
        isActive && styles.activeMenuItem,
        pressed && styles.pressedMenuItem,
      ]}
    >
      {/* ICON */}

      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={25} color={COLORS.chocolateText} />
      </View>

      {/* LABEL */}

      <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
        {label}
      </Text>

      {/* ARROW */}

      <Ionicons name="chevron-forward" size={20} color={COLORS.arrow} />
    </Pressable>
  );
};

/* =========================================================
   SECTION TITLE
========================================================= */

const DrawerSection = ({ title }: { title: string }) => {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
};

/* =========================================================
   CUSTOM DRAWER
========================================================= */

const CustomDrawerContent = (props: any) => {
  const { params } = props;

  const canViewManagement =
    params?.role === 'owner' || params?.role === 'manager';

  /* =======================================================
     SWITCH SHOP
  ======================================================= */

  const switchShop = async () => {
    await clearDeviceSession();

    props.navigation.reset({
      index: 0,
      routes: [
        {
          name: SCREENS.SHOP_PICKER,
        },
      ],
    });
  };

  return (
    <View style={styles.drawerContainer}>
      {/* ===================================================
          CHOCOLATE HEADER
      =================================================== */}

      <View style={styles.headerWrapper}>
        <ImageBackground
          source={require('assets/drawer.png')}
          style={styles.headerBackground}
          imageStyle={styles.headerImage}
          resizeMode="cover"
        >
          {/* Dynamic user information */}
          <View style={styles.userInfo}>
            <Text style={styles.staffName}>{params?.staffName || 'Staff'}</Text>
          </View>
        </ImageBackground>
      </View>

      {/* ===================================================
          MENU
      =================================================== */}

      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.drawerContent}
      >
        {/* =================================================
            MAIN
        ================================================= */}

        <DrawerSection title="MAIN" />

        <DrawerMenuItem
          label="Home"
          icon="home"
          screen={TABSCREENS.HOME}
          navigation={props.navigation}
          state={props.state}
        />

        <DrawerMenuItem
          label="Alerts"
          icon="notifications-outline"
          screen={TABSCREENS.NOTIFY}
          navigation={props.navigation}
          state={props.state}
        />

        {/* =================================================
            INVENTORY
        ================================================= */}

        <DrawerSection title="INVENTORY" />

        <DrawerMenuItem
          label="Stock In"
          icon="cube-outline"
          screen={TABSCREENS.STOCK_IN}
          navigation={props.navigation}
          state={props.state}
        />

        <DrawerMenuItem
          label="Needed Items"
          icon="list-outline"
          screen={TABSCREENS.NEEDS}
          navigation={props.navigation}
          state={props.state}
        />

        <DrawerMenuItem
          label="Price List"
          icon="pricetag-outline"
          screen={TABSCREENS.PRICELIST}
          navigation={props.navigation}
          state={props.state}
        />

        {/* =================================================
            SALES & EXPENSES
        ================================================= */}

        <DrawerSection title="SALES & EXPENSES" />

        <DrawerMenuItem
          label="Bills"
          icon="receipt-outline"
          screen={TABSCREENS.BILLS}
          navigation={props.navigation}
          state={props.state}
        />

        <DrawerMenuItem
          label="Close Bill"
          icon="checkmark-circle-outline"
          screen={TABSCREENS.CLOSEBILLS}
          navigation={props.navigation}
          state={props.state}
        />

        <DrawerMenuItem
          label="Expense"
          icon="wallet-outline"
          screen={TABSCREENS.EXPENSE}
          navigation={props.navigation}
          state={props.state}
        />

        {/* =================================================
            REPORTS & MANAGEMENT
        ================================================= */}

        {canViewManagement && (
          <>
            <DrawerSection title="REPORTS & MANAGEMENT" />

            <DrawerMenuItem
              label="Daily Reports"
              icon="bar-chart"
              screen={TABSCREENS.DAILYREPORTS}
              navigation={props.navigation}
              state={props.state}
            />

            <DrawerMenuItem
              label="Sale Report"
              icon="calendar-outline"
              screen={TABSCREENS.WEEKLY_REPORT}
              navigation={props.navigation}
              state={props.state}
            />

            <DrawerMenuItem
              label="Catalogue"
              icon="images-outline"
              screen={TABSCREENS.CATALOGUE}
              navigation={props.navigation}
              state={props.state}
            />
            <DrawerMenuItem
              label="Attendance"
              icon="people-outline"
              screen={TABSCREENS.ATTENDANCE}
              navigation={props.navigation}
              state={props.state}
            />
          </>
        )}

        {/* =================================================
            SWITCH SHOP
        ================================================= */}

        <View style={styles.switchSpacer} />

        <Pressable
          onPress={switchShop}
          style={({ pressed }) => [
            styles.switchShopItem,
            pressed && styles.pressedMenuItem,
          ]}
        >
          <View style={styles.switchIconContainer}>
            <Ionicons
              name="swap-horizontal"
              size={27}
              color={COLORS.switchText}
            />
          </View>

          <Text style={styles.switchShopText}>Switch Shop</Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.switchText}
          />
        </Pressable>
      </DrawerContentScrollView>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <View style={styles.footer}>
        <View style={styles.footerIcon}>
          <Ionicons name="storefront-outline" size={29} color={COLORS.gold} />
        </View>

        <View style={styles.footerText}>
          <Text style={styles.footerShopName}>Chocolate Paradise</Text>

          <Text style={styles.footerCaption}>Sweetness makes life better</Text>
        </View>
      </View>
    </View>
  );
};

/* =========================================================
   DRAWER NAVIGATION
========================================================= */

const DrawerNav = ({ route }: any) => {
  const params = route.params || {};

  const canViewManagement =
    params.role === 'owner' || params.role === 'manager';

  return (
    <Drawer.Navigator
      drawerContent={props => (
        <CustomDrawerContent {...props} params={params} />
      )}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.chocolate,
        },

        headerTintColor: COLORS.cream,

        headerTitleStyle: {
          fontWeight: '700',
        },

        headerShadowVisible: false,

        /* ===============================================
           COMPACT DRAWER
        =============================================== */

        drawerStyle: {
          width: 300,
          backgroundColor: COLORS.cream,
        },

        drawerType: 'front',

        overlayColor: 'rgba(30, 10, 4, 0.62)',
      }}
    >
      {/* HOME */}

      <Drawer.Screen
        name={TABSCREENS.HOME}
        component={withParams(Home, params)}
        options={{
          title: 'Home',
        }}
      />

      {/* ALERTS */}

      <Drawer.Screen
        name={TABSCREENS.NOTIFY}
        component={withParams(Notifications, params)}
        options={{
          title: 'Alerts',
        }}
      />

      {/* STOCK */}

      <Drawer.Screen
        name={TABSCREENS.STOCK_IN}
        component={withParams(Stock, params)}
        options={{
          title: 'Stock In',
        }}
      />

      {/* NEEDS */}

      <Drawer.Screen
        name={TABSCREENS.NEEDS}
        component={withParams(Needs, params)}
        options={{
          title: 'Needed Items',
        }}
      />

      {/* PRICE LIST */}

      <Drawer.Screen
        name={TABSCREENS.PRICELIST}
        component={withParams(PriceList, params)}
        options={{
          title: 'Price List',
        }}
      />

      {/* BILLS */}

      <Drawer.Screen
        name={TABSCREENS.BILLS}
        component={withParams(Bills, params)}
        options={{
          title: 'Bills',
        }}
      />

      {/* CLOSE BILL */}

      <Drawer.Screen
        name={TABSCREENS.CLOSEBILLS}
        component={withParams(CloseBill, params)}
        options={{
          title: 'Close Bill',
        }}
      />

      {/* EXPENSE */}

      <Drawer.Screen
        name={TABSCREENS.EXPENSE}
        component={withParams(Expense, params)}
        options={{
          title: 'Expense',
        }}
      />

      {/* MANAGEMENT */}

      {canViewManagement && (
        <>
          <Drawer.Screen
            name={TABSCREENS.DAILYREPORTS}
            component={withParams(DailyReports, params)}
            options={{
              title: 'Daily Reports',
            }}
          />

          <Drawer.Screen
            name={TABSCREENS.WEEKLY_REPORT}
            component={withParams(WeeklyReport, params)}
            options={{
              title: 'Sale Report',
            }}
          />

          <Drawer.Screen
            name={TABSCREENS.CATALOGUE}
            component={withParams(Catalogue, params)}
            options={{
              title: 'Catalogue',
            }}
          />

          <Drawer.Screen
            name={TABSCREENS.ATTENDANCE}
            component={withParams(Attendance, params)}
            options={{ title: 'Attendance' }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* =======================================================
     DRAWER
  ======================================================= */

  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  /* =======================================================
     HEADER

     Compact height so the drawer doesn't become huge.
  ======================================================= */

  headerWrapper: {
    height: 275,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: COLORS.chocolate,
  },

  headerBackground: {
    width: '100%',
    height: 275,
  },

  headerImage: {
    width: '100%',
    height: '100%',
  },

  userInfo: {
    position: 'absolute',
    left: 24,
    bottom: 20,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  staffName: {
    marginLeft: 10,
    color: '#FFF8EE',
    fontSize: 17,
    fontFamily: 'serif',
    fontWeight: '500',
  },
  /* =======================================================
     NOTIFICATION
  ======================================================= */

  notificationButton: {
    position: 'absolute',

    top: 18,
    right: 16,

    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 20,
  },

  /* =======================================================
     HEADER USER INFO
  ======================================================= */

  headerUserInfo: {
    position: 'absolute',

    left: 24,
    right: 20,

    bottom: 22,

    zIndex: 10,
  },

  shopName: {
    color: '#FFF8ED',

    fontSize: 20,

    fontFamily: 'serif',

    fontWeight: '700',

    letterSpacing: 0.2,
  },

  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 4,
  },

  staffIcon: {
    marginRight: 9,
  },

  roleText: {
    marginLeft: 32,

    marginTop: 1,

    color: '#E59A38',

    fontSize: 12,

    fontWeight: '800',

    letterSpacing: 1.5,
  },

  /* =======================================================
     CONTENT
  ======================================================= */

  scrollView: {
    backgroundColor: COLORS.cream,
  },

  drawerContent: {
    paddingTop: 2,
    paddingBottom: 6,
  },

  /* =======================================================
     SECTIONS
  ======================================================= */

  sectionWrapper: {
    marginTop: 10,
    marginBottom: 3,

    paddingHorizontal: 27,
  },

  sectionTitle: {
    color: COLORS.section,

    fontSize: 11.5,

    fontWeight: '800',

    letterSpacing: 2.2,
  },

  /* =======================================================
     MENU ITEM
  ======================================================= */

  menuItem: {
    height: 44,

    marginHorizontal: 13,
    marginVertical: 1,

    paddingLeft: 5,
    paddingRight: 7,

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',
  },

  activeMenuItem: {
    backgroundColor: COLORS.creamActive,
  },

  pressedMenuItem: {
    opacity: 0.65,
  },

  /* =======================================================
     ICON
  ======================================================= */

  iconContainer: {
    width: 43,
    height: 43,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 6,
  },

  /* =======================================================
     MENU TEXT
  ======================================================= */

  menuLabel: {
    flex: 1,

    color: COLORS.text,

    fontSize: 17,

    fontFamily: 'serif',

    fontWeight: '500',
  },

  activeMenuLabel: {
    color: COLORS.chocolateText,

    fontWeight: '600',
  },

  /* =======================================================
     SWITCH SHOP
  ======================================================= */

  switchSpacer: {
    height: 4,
  },

  switchShopItem: {
    height: 48,

    marginHorizontal: 13,
    marginTop: 5,
    marginBottom: 7,

    paddingLeft: 5,
    paddingRight: 7,

    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.switchBackground,
  },

  switchIconContainer: {
    width: 43,
    height: 43,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 6,
  },

  switchShopText: {
    flex: 1,

    color: COLORS.switchText,

    fontSize: 17,

    fontFamily: 'serif',

    fontWeight: '600',
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    minHeight: 65,

    borderTopWidth: 1,

    borderTopColor: COLORS.border,

    paddingHorizontal: 21,
    paddingVertical: 6,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.cream,
  },

  footerIcon: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,
  },

  footerText: {
    flex: 1,
  },

  footerShopName: {
    color: COLORS.chocolateText,

    fontSize: 15,

    fontFamily: 'serif',

    fontWeight: '600',
  },

  footerCaption: {
    color: '#AA704A',

    fontSize: 10.5,

    marginTop: 1,

    fontFamily: 'serif',

    fontStyle: 'italic',
  },
});

export default DrawerNav;