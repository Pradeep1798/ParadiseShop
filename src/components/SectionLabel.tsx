

 

  import { StyleSheet, Text, View } from 'react-native'
  import React from 'react'
import { COLORS } from 'theme/Theme';
  
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);
  
  export default SectionLabel
  
  const styles = StyleSheet.create({
     label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  })