import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SearchResult {
  title: string;
  detail: string;
  category: string;
}

interface SearchButtonProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  searchQuery: string;
  emptyMessage?: string;
  colors: {
    primary: string;
    text: string;
    border: string;
    background: string;
    surface: string;
  };
}

export const SearchButton: React.FC<SearchButtonProps> = ({
  placeholder = 'Search...',
  onSearch,
  results,
  isSearching,
  searchQuery,
  emptyMessage = 'No results found',
  colors,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => {
    setShowModal(false);
    onSearch('');
  };

  return (
    <>
      {/* Search Button Icon */}
      <TouchableOpacity
        style={[styles.searchIconButton, { backgroundColor: colors.border, borderColor: colors.primary }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.searchIcon, { color: colors.primary }]}>🔍</Text>
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Search</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={[styles.closeButton, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.text}
                value={searchQuery}
                onChangeText={onSearch}
                autoFocus
              />
            </View>

            {/* Results */}
            <ScrollView style={styles.resultsContainer}>
              {searchQuery.trim().length > 0 ? (
                results.length > 0 ? (
                  results.map((result, index) => (
                    <View
                      key={`${result.title}-${index}`}
                      style={[
                        styles.resultItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.resultTitle, { color: colors.text }]}>
                        {result.title}
                      </Text>
                      <Text style={[styles.resultDetail, { color: colors.text }]}>
                        {result.detail}
                      </Text>
                      <Text
                        style={[styles.resultCategory, { color: colors.primary }]}
                      >
                        {result.category}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      {emptyMessage}
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Start typing to search...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1.5,
  },
  searchIcon: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 16,
  },
  searchInputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    maxHeight: 400,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 12,
    marginBottom: 6,
  },
  resultCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
