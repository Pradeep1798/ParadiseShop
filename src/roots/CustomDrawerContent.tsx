const CustomDrawerContent = (props: any) => {

  const params =
    props.state?.routes?.[0]?.params || {};

  const canViewManagement =
    params.role === 'owner' ||
    params.role === 'manager';

  return (
    <View style={styles.drawerContainer}>

      {/* HEADER */}
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
            {params.role === 'owner'
              ? 'Owner'
              : params.role === 'manager'
              ? 'Manager'
              : 'Staff'}
          </Text>

        </View>

      </View>


      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.drawerContent}
      >

        {/* MAIN */}
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


        {/* INVENTORY */}
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


        {/* SALES */}
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


        {/* REPORTS & MANAGEMENT */}
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


      {/* FOOTER */}
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