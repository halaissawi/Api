"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add the new value to the existing enum type
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        -- Check if 'custom' value already exists in the enum
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'custom' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_Profiles_designMode'
          )
        ) THEN
          -- Add 'custom' to the enum type
          ALTER TYPE "enum_Profiles_designMode" ADD VALUE 'custom';
        END IF;
      END $$;
    `);

    console.log('✅ Successfully added "custom" to designMode enum');
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL does not support removing enum values easily
    // You would need to recreate the enum type completely
    console.log(
      "⚠️ Removing enum values is not supported. Manual intervention required."
    );
  },
};
