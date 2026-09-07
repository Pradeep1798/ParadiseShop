import React from 'react';

import {
  View,
  Text,
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

const Drawer = createDrawerNavigator();

/* =========================================================
   WITH PARAMS
========================================================= */

const withParams = (Component: any, params: any) => (props: any) => (
  <Component
    {...props}
    route={{
      ...props.route,
      params,
    }}
  />
);


/* =========================================================
   REUSABLE DRAWER ITEM
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

      {/* Active indicator */}
      {isActive && (
        <View style={styles.activeIndicator} />
      )}

      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          isActive && styles.activeIconContainer,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? '#5C3620' : '#795548'}
        />
      </View>

      {/* Label */}
      <Text
        style={[
          styles.menuLabel,
          isActive && styles.activeMenuLabel,
        ]}
      >
        {label}
      </Text>

      {/* Active arrow */}
      {isActive && (
        <Ionicons
          name="chevron-forward"
          size={17}
          color="#C17A3D"
        />
      )}

    </Pressable>
  );
};


/* =========================================================
   DRAWER SECTION
========================================================= */

const DrawerSection = ({
  title,
}: {
  title: string;
}) => (
  <Text style={styles.sectionTitle}>
    {title}
  </Text>
);


/* =========================================================
   CUSTOM DRAWER CONTENT
========================================================= */

const CustomDrawerContent = (props: any) => {

  const { params } = props;

  const canViewManagement =
    params?.role === 'owner' ||
    params?.role === 'manager';

    console.log("params",params.role);

    const switchShop = async () => {
  await clearDeviceSession();

  props.navigation.reset({
    index: 0,
    routes: [{ name: SCREENS.SHOP_PICKER }],
  });
};

  return (
    <View style={styles.drawerContainer}>

      {/* ===================================================
          HEADER
      =================================================== */}

      <View style={styles.header}>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            🍫
          </Text>
        </View>

        <View style={styles.headerText}>

          <Text style={styles.shopName}>
            Chocolate Paradise
          </Text>

          <Text style={styles.roleText}>
            {/* {params.role === 'owner'
              ? 'Owner'
              : params.role === 'manager'
              ? 'Manager'
              : 'Staff'} */}
              {params.staffName}
          </Text>

        </View>

      </View>


      {/* ===================================================
          MENU
      =================================================== */}

      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.drawerContent}
      >

        {/* ================= MAIN ================= */}

        <DrawerSection title="MAIN" />

        <DrawerMenuItem
          label="Home"
          icon="home-outline"
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


        {/* ================= INVENTORY ================= */}

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


        {/* ================= SALES ================= */}

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


        {/* ================= REPORTS ================= */}

        {canViewManagement && (
          <>
            <DrawerSection title="REPORTS & MANAGEMENT" />

            <DrawerMenuItem
              label="Daily Reports"
              icon="bar-chart-outline"
              screen={TABSCREENS.DAILYREPORTS}
              navigation={props.navigation}
              state={props.state}
            />

            <DrawerMenuItem
              label="Weekly Report"
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
            
            
          </>
        )}


      </DrawerContentScrollView>

<Pressable
  onPress={switchShop}
  style={({ pressed }) => [
    styles.switchShopItem,
    pressed && styles.pressedMenuItem,
  ]}
>
  <View style={styles.switchShopIcon}>
    <Ionicons
      name="swap-horizontal-outline"
      size={20}
      color="#9C3654"
    />
  </View>

  <Text style={styles.switchShopText}>
    Switch Shop
  </Text>
</Pressable>
      {/* ===================================================
          FOOTER
      =================================================== */}

      <View style={styles.footer}>

        <Ionicons
          name="storefront-outline"
          size={18}
          color="#8A6A52"
        />

        <Text style={styles.footerText}>
          Chocolate Paradise
        </Text>

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
    params.role === 'owner' ||
    params.role === 'manager';

  return (
    <Drawer.Navigator

      drawerContent={(props) => (
        <CustomDrawerContent {...props}  params={params} />
      )}

      screenOptions={{
        /* ================= HEADER ================= */

        headerStyle: {
          backgroundColor: '#5C3620',
        },

        headerTintColor: '#FBF4EC',

        headerTitleStyle: {
          fontWeight: '700',
        },


        /* ================= DRAWER ================= */

        drawerStyle: {
          backgroundColor: '#FFF9F3',
          width: 290,
        },

      }}
    >

      {/* =================================================
          MAIN
      ================================================= */}

      <Drawer.Screen
        name={TABSCREENS.HOME}
        component={withParams(Home, params)}
        options={{
          title: 'Home',
        }}
      />

      <Drawer.Screen
        name={TABSCREENS.NOTIFY}
        component={withParams(Notifications, params)}
        options={{
          title: 'Alerts',
        }}
      />


      {/* =================================================
          INVENTORY
      ================================================= */}

      <Drawer.Screen
        name={TABSCREENS.STOCK_IN}
        component={withParams(Stock, params)}
        options={{
          title: 'Stock In',
        }}
      />

      <Drawer.Screen
        name={TABSCREENS.NEEDS}
        component={withParams(Needs, params)}
        options={{
          title: 'Needed Items',
        }}
      />

      <Drawer.Screen
        name={TABSCREENS.PRICELIST}
        component={withParams(PriceList, params)}
        options={{
          title: 'Price List',
        }}
      />


      {/* =================================================
          SALES
      ================================================= */}

      <Drawer.Screen
        name={TABSCREENS.BILLS}
        component={withParams(Bills, params)}
        options={{
          title: 'Bills',
        }}
      />

      <Drawer.Screen
        name={TABSCREENS.CLOSEBILLS}
        component={withParams(CloseBill, params)}
        options={{
          title: 'Close Bill',
        }}
      />

      <Drawer.Screen
        name={TABSCREENS.EXPENSE}
        component={withParams(Expense, params)}
        options={{
          title: 'Expense',
        }}
      />


      {/* =================================================
          REPORTS & MANAGEMENT
      ================================================= */}

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
              title: 'Weekly Report',
            }}
          />

          <Drawer.Screen
            name={TABSCREENS.CATALOGUE}
            component={withParams(Catalogue, params)}
            options={{
              title: 'Catalogue',
            }}
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
    backgroundColor: '#FFF9F3',
  },


  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    backgroundColor: '#5C3620',

    paddingTop: 55,
    paddingBottom: 22,
    paddingHorizontal: 20,

    flexDirection: 'row',
    alignItems: 'center',

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  logoContainer: {
    width: 52,
    height: 52,

    borderRadius: 16,

    backgroundColor: '#F3E6D5',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  logoText: {
    fontSize: 27,
  },

  headerText: {
    flex: 1,
  },

  shopName: {
    color: '#FFF9F3',

    fontSize: 18,
    fontWeight: '800',
  },

  roleText: {
    color: '#DDBB9B',

    fontSize: 13,

    marginTop: 4,

    fontWeight: '500',

    textTransform: 'capitalize',
  },


  /* =======================================================
     DRAWER CONTENT
  ======================================================= */

  drawerContent: {
    paddingTop: 6,
    paddingBottom: 20,
  },


  /* =======================================================
     SECTION TITLE
  ======================================================= */

  sectionTitle: {
    fontSize: 11,

    fontWeight: '800',

    color: '#A1846D',

    letterSpacing: 1,

    marginTop: 18,
    marginBottom: 7,

    marginHorizontal: 22,
  },


  /* =======================================================
     MENU ITEM
  ======================================================= */

  menuItem: {
    minHeight: 50,

    marginHorizontal: 12,
    marginVertical: 2,

    paddingHorizontal: 10,

    borderRadius: 13,

    flexDirection: 'row',

    alignItems: 'center',
  },

  activeMenuItem: {
    backgroundColor: '#F3E6D5',
  },

  pressedMenuItem: {
    opacity: 0.65,
  },


  /* =======================================================
     ACTIVE INDICATOR
  ======================================================= */

  activeIndicator: {
    position: 'absolute',

    left: 0,

    width: 4,
    height: 28,

    backgroundColor: '#C17A3D',

    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },


  /* =======================================================
     ICON
  ======================================================= */

  iconContainer: {
    width: 38,
    height: 38,

    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 8,
  },

  activeIconContainer: {
    backgroundColor: '#E8D2B9',
  },


  /* =======================================================
     LABEL
  ======================================================= */

  menuLabel: {
    flex: 1,

    fontSize: 15,

    color: '#795548',

    fontWeight: '500',
  },

  activeMenuLabel: {
    color: '#5C3620',

    fontWeight: '700',
  },


  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    borderTopWidth: 1,

    borderTopColor: '#EADDD0',

    paddingHorizontal: 20,
    paddingVertical: 16,

    flexDirection: 'row',

    alignItems: 'center',
  },

  footerText: {
    marginLeft: 9,

    color: '#8A6A52',

    fontSize: 12,

    fontWeight: '500',
  },

  switchShopItem: {
  minHeight: 50,
  marginHorizontal: 12,
  marginBottom: 12,
  paddingHorizontal: 10,
  borderRadius: 13,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FCEFF2',
},

switchShopIcon: {
  width: 38,
  height: 38,
  borderRadius: 11,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
},

switchShopText: {
  flex: 1,
  fontSize: 15,
  color: '#670d28',
  fontWeight: '700',
},

});

export default DrawerNav;