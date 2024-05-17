import * as yup from 'yup'

export const doctorSchema = yup.object({
    email:yup.string().trim().email('Email not valid').required('Email is Required'),
    password:yup.string().trim().required('Password is required').min(4,'Minimum 4 characters required'),
    name:yup.string().trim().required('Name is required').max(50,'Maximiumn 50 characters for name'),
    dob:yup.string().required('D.O.B required'),
    speciality:yup.string().trim().required('Speciality required'), 
}).strict().noUnknown("It seems you have entered fields that are not allowed")

export const patientSchema = yup.object().shape({
    register:yup.object({
        email:yup.string().trim().email('Email not valid').required('Email is Required'),
        password:yup.string().trim().required('Password is required').min(4,'Minimum 4 characters required'),
        name:yup.string().trim().required('Name is required').max(50,'Maximiumn 50 characters for name'),
        dob:yup.string().required('D.O.B required')
    }).strict().noUnknown("It seems you have entered fields that are not allowed"),
    
    login:yup.object({
        email:yup.string().trim().email('Email not valid').required('Email is Required'),
        password:yup.string().trim().required('Password is required').min(4,'Minimum 4 characters required'),
    }).strict().noUnknown("It seems you have entered fields that are not allowed"),

}).strict().noUnknown("It seems you have entered fields that are not allowed")

export const logsSchema = yup.object({
    update:yup.object().shape({
        dischargeAt:yup.string().trim().required('dischargeAt is required'),
        amount:yup.number().required('amount is required')
    }).strict(),
    create:yup.object({
        doctor:yup.string().trim().required('Doctor is required'),
        patient:yup.string().trim().required('Patient is required'),
        disease:yup.string().trim().required('Disease is required'),
        admittedAt:yup.string().trim().required('Admitted date is required'),
        dischargeAt:yup.string().trim().nullable(),
        amount:yup.number().nullable()
    }).strict().noUnknown("It seems you have entered fields that are not allowed"),
}).strict().noUnknown("It seems you have entered fields that are not allowed")