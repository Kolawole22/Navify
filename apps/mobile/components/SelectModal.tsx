import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LegendList } from "@legendapp/list";
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  onSelect: (option: SelectOption) => void;
  onClose: () => void;
  searchable?: boolean;
  isLoading?: boolean; // Add isLoading prop
}

const SelectModal: React.FC<SelectModalProps> = ({
  visible,
  title,
  options,
  onSelect,
  onClose,
  searchable = false,
  isLoading = false, // Default to false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (searchable) {
      if (searchTerm === "") {
        setFilteredOptions(options);
      } else {
        setFilteredOptions(
          options.filter((option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options, searchable]);

  // Reset search when modal opens/closes or options change
  useEffect(() => {
    if (visible) {
      setSearchTerm("");
    }
  }, [visible, options]);

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-center items-center bg-black/50 w-full">
          <View className="m-5 bg-white rounded-lg p-5 items-center shadow-md w-[90%] max-h-[80%]">
            <Text className="mb-4 text-center text-lg font-bold">{title}</Text>
            {searchable && (
              <TextInput
                className="h-10 border border-gray-300 rounded p-2 mb-4 w-full"
                placeholder="Search..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            )}

            {/* --- Loading Indicator --- */}
            {isLoading && (
              <View className="flex-1 min-h-[100px] justify-center items-center py-5">
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}

            {/* --- Options List (hide if loading) --- */}
            {!isLoading && (
              <View className="w-full h-[80%]">
                <LegendList
                  data={filteredOptions}
                  estimatedItemSize={filteredOptions.length}
                  extraData={filteredOptions}
                  keyExtractor={(item, index) => `${item.value}-${index}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View className="w-full h-full items-center border-b border-[#eee]">
                      <TouchableOpacity
                        className="py-3 items-center"
                        onPress={() => onSelect(item)}
                      >
                        <Text className="text-base">{item.label}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  // Optional: Add Empty List Component
                  ListEmptyComponent={
                    <Text className="text-center text-gray-500 mt-5 pb-5">No options available</Text>
                  }
                  // Add keyboardShouldPersistTaps to prevent keyboard dismissing list item press
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}

            <TouchableOpacity 
              className="mt-4 bg-[#007AFF] rounded py-2.5 px-5 shadow"
              onPress={onClose}
            >
              <Text className="text-white font-bold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SelectModal;
