import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { testBackendConnection } from '../utils/networkDiagnostics';

const BackendTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      const results = await testBackendConnection();
      
      const output = [
        '=== Backend Connection Test ===',
        '',
        `Connection Test: ${results.connection.success ? '✅ SUCCESS' : '❌ FAILED'}`,
        `Message: ${results.connection.message}`,
        '',
        `Auth Test: ${results.auth.success ? '✅ SUCCESS' : '❌ FAILED'}`,
        `Message: ${results.auth.message}`,
        '',
        '=== API Configuration ===',
        'Check src/config/apiConfig.ts to update URLs',
        '',
        '=== Common Solutions ===',
        '1. Make sure backend is running (dotnet run)',
        '2. Update API URL in apiConfig.ts',
        '3. Check firewall settings',
        '4. For Android emulator: use 10.0.2.2:5000',
        '5. For physical device: use your computer IP',
      ];
      
      setTestResults(output);
      
      if (!results.connection.success || !results.auth.success) {
        Alert.alert(
          'Connection Issues Detected',
          'The backend connection test failed. Please check the results below and follow the troubleshooting steps.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setTestResults([`Test failed with error: ${error.message}`]);
      Alert.alert('Test Error', error.message, [{ text: 'OK' }]);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>
      <Text style={styles.subtitle}>
        Use this tool to diagnose connection issues with the backend server.
      </Text>
      
      <TouchableOpacity
        style={[styles.testButton, isTesting && styles.testButtonDisabled]}
        onPress={runConnectionTest}
        disabled={isTesting}
      >
        <Text style={styles.testButtonText}>
          {isTesting ? 'Testing...' : 'Run Connection Test'}
        </Text>
      </TouchableOpacity>
      
      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((line, index) => (
            <Text key={index} style={styles.resultLine}>
              {line}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultLine: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});

export default BackendTest;
