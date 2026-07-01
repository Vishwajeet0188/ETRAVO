import { pool } from "../src/db.js";

export async function getProfile(req,res,next){
  try{
    const userId = req.auth.sub;

    const result = await pool.query(
      `
      SELECT
          u.id,
          u.name,
          u.email,
          u.phone,

          dp.date_of_birth as "dateOfBirth",
          dp.address,
          dp.city,
          dp.pincode,

          dp.driver_license_number as "driverLicenseNumber",
          dp.license_expiry_date as "licenseExpiryDate",
          dp.experience,

          dp.vehicle_number as "vehicleNumber",
          dp.vehicle_model as "vehicleModel",
          dp.vehicle_color as "vehicleColor",
          dp.vehicle_year as "vehicleYear",
          dp.seating_capacity as "seatingCapacity",

          dp.profile_photo_link as "profilePhoto",
          dp.license_link as "licensePhoto",
          dp.rc_link as "vehicleRCPhoto",
          dp.insurance_link as "insurancePhoto",

          dp.bank_name as "bankName",
          dp.account_number as "accountNumber",
          dp.ifsc_code as "ifscCode",
          dp.upi_id as "upiId"

      FROM users u
      LEFT JOIN driver_profiles dp
        ON u.id = dp.user_id
      WHERE u.id = $1
      `,
      [userId]
    );

    res.json(result.rows[0] || {});
  }
  catch(error){
    next(error);
  }
}



export async function updateProfile(req,res,next){
  try{
    const userId = req.auth.sub;

    const {
      dateOfBirth,
      address,
      city,
      pincode,

      driverLicenseNumber,
      licenseExpiryDate,
      experience,

      vehicleNumber,
      vehicleModel,
      vehicleColor,
      vehicleYear,
      seatingCapacity,

      profilePhotoLink,
      licenseLink,
      rcLink,
      insuranceLink,

      bankName,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;

    await pool.query(
      `
      UPDATE users
      SET
          name = $1,
          email = $2,
          phone = $3
      WHERE id = $4
      `,
      [
        req.body.name,
        req.body.email,
        req.body.phone,
        userId,
      ]
    );

    await pool.query(
      `
      INSERT INTO driver_profiles(
        user_id,
        date_of_birth,
        address,
        city,
        pincode,
        driver_license_number,
        license_expiry_date,
        experience,
        vehicle_number,
        vehicle_model,
        vehicle_color,
        vehicle_year,
        seating_capacity,
        profile_photo_link,
        license_link,
        rc_link,
        insurance_link,
        bank_name,
        account_number,
        ifsc_code,
        upi_id
      )
      VALUES(
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,$12,$13,
        $14,$15,$16,$17,
        $18,$19,$20,$21
      )
      ON CONFLICT(user_id)
      DO UPDATE SET
      date_of_birth=EXCLUDED.date_of_birth,
      address=EXCLUDED.address,
      city=EXCLUDED.city,
      pincode=EXCLUDED.pincode,
      driver_license_number=EXCLUDED.driver_license_number,
      license_expiry_date=EXCLUDED.license_expiry_date,
      experience=EXCLUDED.experience,
      vehicle_number=EXCLUDED.vehicle_number,
      vehicle_model=EXCLUDED.vehicle_model,
      vehicle_color=EXCLUDED.vehicle_color,
      vehicle_year=EXCLUDED.vehicle_year,
      seating_capacity=EXCLUDED.seating_capacity,
      profile_photo_link=EXCLUDED.profile_photo_link,
      license_link=EXCLUDED.license_link,
      rc_link=EXCLUDED.rc_link,
      insurance_link=EXCLUDED.insurance_link,
      bank_name=EXCLUDED.bank_name,
      account_number=EXCLUDED.account_number,
      ifsc_code=EXCLUDED.ifsc_code,
      upi_id=EXCLUDED.upi_id
      `,
      [
        userId,
        dateOfBirth,
        address,
        city,
        pincode,
        driverLicenseNumber,
        licenseExpiryDate,
        experience,
        vehicleNumber,
        vehicleModel,
        vehicleColor,
        vehicleYear,
        seatingCapacity,
        profilePhotoLink,
        licenseLink,
        rcLink,
        insuranceLink,
        bankName,
        accountNumber,
        ifscCode,
        upiId
      ]
    );

    res.json({
      message:"Profile updated successfully"
    });

  } catch(error){
    next(error);
  }
}