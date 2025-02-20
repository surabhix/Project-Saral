const Student = require("../models/students")
const School = require("../models/school")
const Exam = require("../models/exams")
const Marks = require("../models/marks").marksSchema
const studentController = require('../controller/studentController')
const mockStudentdata = require('./mock-data/student.json')
const AppError = require('../utils/appError')
const Helper = require('../middleware/helper')
const mockFetchExamData = require('./mock-data/mockFetchExam.json')
const mockMarksData = require('./mock-data/mockMarksData.json')
const mockSchoolData = require("./mock-data/school.json")


const mockRequest = () => {
  const req = {}
  req.query = jest.fn().mockReturnValue(req)
  req.params = jest.fn().mockReturnValue(req)
  req.school = jest.fn().mockReturnValue(req)
  req.dbConnection = {
    model: (ref, schema) => {
        return schema
    }
  }
  return req
}

const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res
}

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MDAxIiwic2Nob29sSWQiOiJ1MDAxIiwiaWF0IjoxNjcxMTY4OTY3fQ.jwx3xxTTP3dtJwJFUD4QAUsuBT8uemzyTpiKEIRhzKg"


describe('fetch student and exam data ', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it("should throw 404 error if body doesnot have data ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.school = {
      "_id": "63aa81d2d33aca650009c946",
      "name": "user13",
      "userId": "u001",
      "schoolId": "u001",
      "password": "$2a$08$fCagseJwhdNd3SEd8EB.oO6n990WLmDr4ptUpzJxLp2nvMFSZGpjG",
      "createdAt": "2022-12-27T05:25:38.298Z",
      "updatedAt": "2022-12-27T05:25:38.298Z",
      __v: 0
    }
   
    await studentController.fetchStudentsandExams(req, res, jest.fn())
    
    let error = new AppError('Please send classId', 404);
    expect(error.statusCode).toBe(404);
    expect(error.status).toBe('fail');
   
  });

  it("should able to mark student absent/present", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.school = {
      "_id": "63aa81d2d33aca650009c946",
      "name": "user13",
      "userId": "u001",
      "schoolId": "u001",
      "password": "$2a$08$fCagseJwhdNd3SEd8EB.oO6n990WLmDr4ptUpzJxLp2nvMFSZGpjG",
      "createdAt": "2022-12-27T05:25:38.298Z",
      "updatedAt": "2022-12-27T05:25:38.298Z",
      __v: 0
    }
    req.query = {
      "classId": "2",
      "section":"D",
      "subject": "Hindi 23/09/2021",
      "set": "A"
    }

    Helper.lockScreenValidator  = jest.fn().mockResolvedValue(undefined)
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    Marks.findOne = jest.fn().mockResolvedValue(mockMarksData)
    Student.find = jest.fn().mockReturnValue({ lean: () => mockStudentdata })
    Exam.find = jest.fn().mockResolvedValue(mockFetchExamData)
    await studentController.fetchStudentsandExams(req, res, jest.fn())

    expect(req.query.classId).toEqual('2');
    expect(Helper.lockScreenValidator ).toHaveBeenCalledTimes(1)
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(Student.find).toHaveBeenCalledTimes(1)
    expect(Exam.find).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json({ status: 'success' }).status(200));
  });

  it("should able to get student data  ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.school = {
      "_id": "63aa81d2d33aca650009c946",
      "name": "user13",
      "userId": "u001",
      "schoolId": "u001",
      "password": "$2a$08$fCagseJwhdNd3SEd8EB.oO6n990WLmDr4ptUpzJxLp2nvMFSZGpjG",
      "createdAt": "2022-12-27T05:25:38.298Z",
      "updatedAt": "2022-12-27T05:25:38.298Z",
      __v: 0
    }
    req.query = {
      "classId": "2",
      "section":"D",
      "subject": "Hindi 23/09/2021",
      "set": "A"
    }

    Helper.lockScreenValidator  = jest.fn().mockResolvedValue(undefined)
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    Marks.findOne = jest.fn().mockResolvedValue(null)
    Student.find = jest.fn().mockReturnValue({ lean: () => mockStudentdata })
    // Student.find = jest.fn().mockImplementationOnce(() => ({ select: jest.fn().mockResolvedValueOnce(mockStudentdata)}));
    Exam.find = jest.fn().mockResolvedValue(mockFetchExamData)
    await studentController.fetchStudentsandExams(req, res, jest.fn())

    expect(req.query.classId).toEqual('2');
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(Helper.lockScreenValidator ).toHaveBeenCalledTimes(1)
    expect(Student.find).toHaveBeenCalledTimes(1)
    expect(Exam.find).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json({ status: 'success' }).status(200));
  });

  it("should able to get student data when minimal mode is true ", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.school = {
      "_id": "63aa81d2d33aca650009c946",
      "name": "user13",
      "userId": "u001",
      "schoolId": "u001",
      "password": "$2a$08$fCagseJwhdNd3SEd8EB.oO6n990WLmDr4ptUpzJxLp2nvMFSZGpjG",
      "createdAt": "2022-12-27T05:25:38.298Z",
      "updatedAt": "2022-12-27T05:25:38.298Z",
      __v: 0
    }
    req.query = {
      "classId": "2",
      "section":"D",
      "subject": "Hindi 23/09/2021",
      "set": "A"
    }

    Helper.lockScreenValidator  = jest.fn().mockResolvedValue(undefined)
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    Marks.findOne = jest.fn().mockResolvedValue(null)
    Student.find = jest.fn().mockReturnValue({ lean: () => mockStudentdata })
    Exam.find = jest.fn().mockResolvedValue(mockFetchExamData)
    await studentController.fetchStudentsandExams(req, res, jest.fn())

    expect(req.query.classId).toEqual('2');
    expect(Helper.lockScreenValidator ).toHaveBeenCalledTimes(1)
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(Student.find).toHaveBeenCalledTimes(1)
    expect(Exam.find).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json({ status: 'success' }).status(200));
  });
  
  it("should log an error when any exception occurs", async () => {
    const req = mockRequest();
    const res = mockResponse()
    req.school = {
      "_id": "63aa81d2d33aca650009c946",
      "name": "user13",
      "userId": "u001",
      "schoolId": "u001",
      "password": "$2a$08$fCagseJwhdNd3SEd8EB.oO6n990WLmDr4ptUpzJxLp2nvMFSZGpjG",
      "createdAt": "2022-12-27T05:25:38.298Z",
      "updatedAt": "2022-12-27T05:25:38.298Z",
      __v: 0
    }
    req.query = {
      "classId": "2",
      "section":"D",
      "subject": "Hindi 23/09/2021",
      "set": "A"
    }

    Helper.lockScreenValidator  = jest.fn().mockResolvedValue(undefined)
    School.findOne = jest.fn().mockResolvedValue(mockSchoolData)
    Marks.findOne = jest.fn().mockRejectedValue(new Error('Something went wrong'))
    Student.find = jest.fn().mockReturnValue({ lean: () => mockStudentdata })
    // Student.find = jest.fn().mockImplementationOnce(() => ({ select: jest.fn().mockResolvedValueOnce(mockStudentdata)}));
    Exam.find = jest.fn().mockResolvedValue(mockFetchExamData)
    await studentController.fetchStudentsandExams(req, res, jest.fn())

    expect(req.query.classId).toEqual('2');
    expect(School.findOne).toHaveBeenCalledTimes(1)
    expect(Helper.lockScreenValidator ).toHaveBeenCalledTimes(1)
    expect(Student.find).toHaveBeenCalledTimes(1)
    expect(Exam.find).toHaveBeenCalledTimes(0)
    expect(res.status).toHaveBeenCalledWith(400);
  });

});
