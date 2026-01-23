import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
      sender: 'support',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setSending(true);

    // Simuler une réponse automatique
    setTimeout(() => {
      const responses = [
        'Merci pour votre question. Un de nos pharmaciens vous répondra sous peu.',
        'Je comprends votre préoccupation. Laissez-moi vous aider avec cela.',
        'C\'est une excellente question. Voici quelques informations utiles...',
        'Pour votre sécurité, je recommande de consulter votre médecin pour cette question.',
      ];
      
      const botMessage = {
        id: messages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'support',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setSending(false);
    }, 1500);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Avatar.Icon
          size={40}
          icon="headset"
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Support Pharmacien
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            En ligne
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.supportMessage,
            ]}
          >
            {message.sender === 'support' && (
              <Avatar.Icon
                size={32}
                icon="pharmacy"
                style={styles.messageAvatar}
              />
            )}
            <Card
              style={[
                styles.messageCard,
                message.sender === 'user' ? styles.userCard : styles.supportCard,
              ]}
            >
              <Card.Content style={styles.messageContent}>
                <Text variant="bodyMedium" style={styles.messageText}>
                  {message.text}
                </Text>
                <Text variant="bodySmall" style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </Text>
              </Card.Content>
            </Card>
            {message.sender === 'user' && (
              <Avatar.Icon
                size={32}
                icon="account"
                style={styles.messageAvatar}
              />
            )}
          </View>
        ))}

        {sending && (
          <View style={styles.sendingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodySmall" style={styles.sendingText}>
              Le support tape...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Tapez votre message..."
          mode="outlined"
          multiline
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            />
          }
        />
        <Button
          mode="contained"
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={styles.sendButton}
          icon="send"
        >
          Envoyer
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
  },
  headerAvatar: {
    backgroundColor: theme.colors.primary,
  },
  headerInfo: {
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    color: theme.colors.placeholder,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  supportMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.xs,
  },
  messageCard: {
    maxWidth: '75%',
    elevation: 1,
  },
  userCard: {
    backgroundColor: theme.colors.primary,
  },
  supportCard: {
    backgroundColor: theme.colors.surface,
  },
  messageContent: {
    padding: theme.spacing.sm,
  },
  messageText: {
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  messageTime: {
    color: theme.colors.placeholder,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  sendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  sendingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.disabled,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: theme.spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: theme.spacing.xs,
  },
});

export default ChatScreen;
