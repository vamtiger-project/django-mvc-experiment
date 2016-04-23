from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
from future_builtins import *
from re import compile
from datetime import datetime
import threading
import time
import os
import subprocess
from json import dumps

from django.shortcuts import render
from django.http import HttpResponse
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from xlwt import Workbook

from models import Gig

class GigInfo(object):
		def __init__(self):
			self.manager = self.__manager
			self.load = self.__load
			self.gigViewerDataListOptions = self.__gigViewerDataListOptions
			self.save = self.__save
			self.requestGigsToPublish = self.__requestGigsToPublish
			self.publishWebPage = self.__publishWebPage
			self.requestGigYears = self.__requestGigYears
			self.exportGigInfoToExcelFormat = self.__exportGigInfoToExcelFormat
			self.openExportedExcelFiles = self.__openExportedExcelFiles

			self.regex = self.__getRegex()
			self.thread = self.__getThread()
			self.setVenueOptions = self.__setVenueOptions
			self.setReferenceOptions = self.__setReferenceOptions
			self.setTelephoneOptions = self.__setTelephoneOptions
			self.setEmailOptions = self.__setEmailOptions
			self.getGigInfo = self.__getGigInfo
			self.getGigRecordObject = self.__getGigRecordObject
			self.getFormattedDate = self.__getFormattedDate
			self.getFormattedTime = self.__getFormattedTime
			self.getMonthName = self.__getMonthName

			self.request = self.saveStatus = self.recordId = self.gigRecordObject = \
			self.venueOptions = self.referenceOptions = self.telephoneOptions = self.emailOptions = \
			self.gigsToPublish = self.webPagePublicationStatus = \
			self.gigYears = \
			self.excelFiles = None

		def __manager(self, request):
			return render(request, "gigManager.html", {})

		def __load(self, request):
			return self.__loadGigInfoByRequestMethod(request)

		def __loadGigInfoByRequestMethod(self, request):
			self.request = request
			gigInfo = self.__getGigInfoByRequestMethod()

			return HttpResponse(
				dumps(gigInfo), 
				content_type = "application/javascript"
			)

		def __getGigInfoByRequestMethod(self):
			getGigInfoByRequestMethod = {
				"initialize": self.__getInitializationGigInfo,
				"year": self.__getYearGigInfo,
			}

			gigInfo = getGigInfoByRequestMethod[self.request.GET['gigInfoRequestMethod']]()

			return gigInfo

		def __getInitializationGigInfo(self):
			gigInfo = self.__getGigInfoObject()
			moseRecentGigYear = Gig.objects.all().first().date.year
			
			for gigRecord in Gig.objects.all():

				if gigRecord.date.year == moseRecentGigYear:
					mostRecentYearGig = self.__getGigRecordObject(gigRecord)

					gigInfo["gigs"].append(mostRecentYearGig)

				if not gigRecord.date.year in gigInfo["years"]:
					gigInfo["years"].append(gigRecord.date.year)

			gigInfo["years"].reverse()
			gigInfo["gigs"].reverse()

			return gigInfo

		def __getYearGigInfo(self):
			gigInfo = self.__getGigInfoObject()
			selectedYearGigs = Gig.objects.filter(date__year = self.request.GET['year']).reverse() # Ascending order
			
			for gigRecord in selectedYearGigs:
				gigRecordObject = self.__getGigRecordObject(gigRecord)
				gigInfo["gigs"].append(gigRecordObject)

			return gigInfo

		def __getGigInfoObject(self):
			def initialize():
				gigInfoObject = {
					"days": self.__getDays(),
					"months": self.__getMonths(),
					"years": [],
					"gigs": []
				}

				return gigInfoObject

			def year():
				gigInfoObject = {
					"gigs": []
				}

				return gigInfoObject

			getGigInfoObject = {
				"initialize": initialize,
				"year": year,
			}

			return getGigInfoObject[self.request.GET['gigInfoRequestMethod']]()

		def __getGigRecordObject(self, gigRecord):
			gigRecordObject = {
				"id": gigRecord.id,
				"date": {
					"year": gigRecord.date.year,
					"month": gigRecord.date.month,
					"monthName": self.__getMonthName(gigRecord.date.month),
					"day": gigRecord.date.day,
					"dayName": self.__getDayName(gigRecord.date.weekday())
				},
				"start": {
					"hour": self.__singleDigitFormat(gigRecord.start.hour),
					"minute": self.__singleDigitFormat(gigRecord.start.minute),
				},
				"end": {
					"hour": self.__singleDigitFormat(gigRecord.end.hour),
					"minute": self.__singleDigitFormat(gigRecord.end.minute),
				},
				"venue": gigRecord.venue,
				"reference": {
					"name": gigRecord.reference,
					"tel": gigRecord.reference_telephone,
					"email": gigRecord.reference_email,
				},
				"invoice": {
					"quote": gigRecord.invoice,
					"paid": str(gigRecord.paid),
				},
				"cancelled": str(gigRecord.cancelled),
				"notes": gigRecord.notes
			}

			return gigRecordObject

		def __getDayName(self, weekDay):
			dayNames = {
				0: "Mon",
				1: "Tue",
				2: "Wed",
				3: "Thu",
				4: "Fri",
				5: "Sat",
				6: "Sun"
			}

			return dayNames[weekDay]

		def __getDays(self):
				days = []

				for dayIndex in range(7):
					day = self.__getDayName(dayIndex)
					days.append(day)

				return days

		def __getMonthName(self, month):
			monthNames = {
				1: "Jan",
				2: "Feb",
				3: "Mar",
				4: "Apr",
				5: "May",
				6: "Jun",
				7: "Jul",
				8: "Aug",
				9: "Sep",
				10: "Oct",
				11: "Nov",
				12: "Dec"
			}

			return monthNames[month]

		def __getMonths(self):
			months = []

			for monthIndex in range(1, 13):
				monthName = self.__getMonthName(monthIndex)
				months.append(monthName)

			return months

		def __singleDigitFormat(self, digit):
			digitString = str(digit)

			if len(digitString) == 1:
				digitString = digitString.zfill(2)

			return digitString

		def __getFormattedTime(self, time):
			formattedTime = ":".join([self.__singleDigitFormat(time.hour), self.__singleDigitFormat(time.minute)])

			return formattedTime

		def __getFormattedDate(self, date):
			formattedDate = date.strftime("%d/%m/%Y")

			return formattedDate

		def __gigViewerDataListOptions(self, request):
			self.thread.setGigViewerDataListOptions()

			gigViewerDataListOptions = {
				"venues": self.venueOptions,
				"references": self.referenceOptions,
				"telephones": self.telephoneOptions,
				"emails": self.emailOptions,
			}

			return HttpResponse(
				dumps(gigViewerDataListOptions), 
				content_type = "application/javascript"
			)

		@csrf_exempt
		def __save(self, request):
			self.__saveGigInfo(request)

			return HttpResponse(
				dumps({
					"status": self.saveStatus,
					"gigInfo": self.gigRecordObject,
				}), 
				content_type = "application/javascript"
			)

		def __saveGigInfo(self, request):
			self.request = request
			self.saveStatus = "unsaved"

			self.__saveGigInfoToDb()

		def __saveGigInfoToDb(self):
			def getGetGigInfoType():
				gigInfoType = None

				if self.regex.nothing.match(self.request.POST["id"]):
					gigInfoType = "new"
				else:
					gigInfoType = "existing"

				return gigInfoType

			saveGigInfo = {
				"new": self.__saveNewGigInfo,
				"existing": self.__updateExistingGigInfo,
			}

			saveGigInfo[getGetGigInfoType()]()

		def __saveNewGigInfo(self):
			class NewGigObject(object):

				def __init__(self, parent):
					self.parent = parent

					self.date = self.parent.getGigInfo("date")
					self.start = self.parent.getGigInfo("start")
					self.end = self.parent.getGigInfo("end")
					self.paid = self.parent.getGigInfo("paid")
					self.cancelled = self.parent.getGigInfo("cancelled")
					self.venue = self.parent.getGigInfo("venue")
					self.invoice = self.parent.getGigInfo("invoice")
					self.reference = self.parent.getGigInfo("reference")
					self.reference_telephone = self.parent.getGigInfo("reference_telephone")
					self.reference_email = self.parent.getGigInfo("reference_email")
					self.notes = self.parent.getGigInfo("notes")

				def __gigInfoExists(self):
					gigInfoExists = False
					selectedYearGigs = Gig.objects.filter(date__year = self.date.year)
					
					for gigRecord in selectedYearGigs:
						similarityScore = self.__getSimilarityScore(gigRecord)
						
						if similarityScore >= 4:
							gigInfoExists = True
							break

					return gigInfoExists

				def __getSimilarityScore(self, gigRecord):
					similarityScore = 0

					if self.venue == gigRecord.venue:
						similarityScore += 1
					if self.date == gigRecord.date:
						similarityScore += 1
					if self.start == gigRecord.start:
						similarityScore += 1
					if self.end == gigRecord.end:
						similarityScore += 1

					return similarityScore

				def save(self):
					if not self.__gigInfoExists():
						newGigRecord = Gig(
							date = self.date,
							start = self.start,
							end = self.end,
							paid = self.paid,
							cancelled = self.cancelled,
							venue = self.venue,
							invoice = self.invoice,
							reference = self.reference,
							reference_telephone = self.reference_telephone,
							reference_email = self.reference_email,
							notes = self.notes,
						)

						newGigRecord.save()

						self.parent.saveStatus = "saved"
						self.parent.gigRecordObject = self.parent.getGigRecordObject(newGigRecord)
					else:
						self.parent.saveStatus = "gigInfoExists"


			gig = NewGigObject(self)
			gig.save()

		def __updateExistingGigInfo(self):
			class GigUpdateObject(object):

				def __init__(self, parent):
					self.parent = parent
					self.update_fields = []

					self.dbReference = Gig.objects.get(id = self.parent.request.POST["id"])

					self.date = self.__getGigInfo("date")
					self.start = self.__getGigInfo("start")
					self.end = self.__getGigInfo("end")
					self.paid = self.__getGigInfo("paid")
					self.cancelled = self.__getGigInfo("cancelled")
					self.venue = self.__getGigInfo("venue")
					self.invoice = self.__getGigInfo("invoice")
					self.reference = self.__getGigInfo("reference")
					self.reference_telephone = self.__getGigInfo("reference_telephone")
					self.reference_email = self.__getGigInfo("reference_email")
					self.notes = self.__getGigInfo("notes")

				def __getGigInfo(self, field):
					gigInfo = self.parent.getGigInfo(field)
					
					if gigInfo != getattr(self.dbReference, field):
						self.update_fields.append(field)

					return gigInfo

				def update(self):
					if self.update_fields:
						for field in self.update_fields:
							fieldValue = getattr(self, field)

							setattr(self.dbReference, field, fieldValue)

						self.dbReference.save(update_fields = self.update_fields)

						self.parent.saveStatus = "updated"
						self.parent.gigRecordObject = self.parent.getGigRecordObject(Gig.objects.get(id = self.parent.request.POST["id"]))
					else:
						self.parent.saveStatus = "gigInfoExists"

			gig = GigUpdateObject(self)
			gig.update()

		def __getGigInfo(self, field):
			def date():
				gigInfo = datetime.strptime(self.request.POST[field], "%Y-%m-%d").date()

				return gigInfo

			def time():
				gigInfo = datetime.strptime(self.request.POST[field], "%H:%M").time()

				return gigInfo

			def paid():
				status = self.request.POST["status"]

				if self.regex.paid.match(status):
					gigInfo = True
				elif self.regex.unpaid.match(status) or self.regex.cancelled.match(status):
					gigInfo = False

				return gigInfo

			def cancelled():
				status = self.request.POST["status"]

				if self.regex.cancelled.match(status):
					gigInfo = True
				elif self.regex.paid.match(status) or self.regex.unpaid.match(status):
					gigInfo = False

				return gigInfo

			def getFloat():
				gigInfo = float(self.request.POST[field])

				return gigInfo

			def generic():
				gigInfo = self.request.POST[field]

				return gigInfo

			getGigInfo = {
				"date": date,
				"start": time,
				"end": time,
				"paid": paid,
				"cancelled": cancelled,
				"invoice": getFloat,
				"venue": generic,
				"reference": generic,
				"reference_telephone": generic,
				"reference_email": generic,
				"notes": generic,
			}

			gigInfo = getGigInfo[field]()

			return gigInfo

		def __getRegex(self):
			class Regex(object):

				def __init__(self):
					self.nothing = self.__getNothing()
					self.paid = self.__getPaid()
					self.unpaid = self.__getUnpaid()
					self.cancelled = self.__getCancelled()
					self.gigGuideArticleContents = self.__getGigGuideArticleContents()

				def __getNothing(self):
					nothingRegex = compile(r"\A\Z")

					return nothingRegex

				def __getPaid(self):
					paidRegex = compile(r"""
						\A # Start anchor
							paid # String pattern
						\Z # End anchor
						(?xi) # Regex verbose and ignore case options
					""")

					return paidRegex

				def __getUnpaid(self):
					unpaidRegex = compile(r"""
						\A # Start anchor
							unpaid # String pattern
						\Z # End anchor
						(?xi) # Regex verbose and ignore case options
					""")

					return unpaidRegex

				def __getCancelled(self):
					cancelledRegex = compile(r"""
						\A # Start anchor
							cancelled # String pattern
						\Z # End anchor
						(?xi) # Regex verbose and ignore case options
					""")

					return cancelledRegex

				def __getGigGuideArticleContents(self):
					gigGuideArticleContentsRegex = compile(r'''
						\A # Start anchor
							( # Open capture group
								\s+ # One or more whitespaces
								articleContents # Literal string
								\s # Whitespace
								= # Literal string
								\s # Whitespace
								" # Literal string
							) # Close capture group
							( # Open capture group
								" # Litteral string
								; # Litteral string
								\s # Whitespace
							) # Close capture group
						\Z # End anchor
						(?x)
					''')

					return gigGuideArticleContentsRegex

			return Regex()

		def __getThread(self):
			class Thread(object):

				def __init__(self, parent):
					self.parent = parent

					self.createThread = self.__createThread()
					self.startThreads = self.__startThreads
					self.synchronizeThreads = self.__synchronizeThreads

					self.setGigViewerDataListOptions = self.__setGigViewerDataListOptions

				def __createThread(self):
					class CreatThread(threading.Thread):

						def __init__(self, thread):
							super(CreatThread, self).__init__()

							self.thread = thread

						def run(self):
							self.thread()

					return CreatThread

				def __startThreads(self, threads):
					for thread in threads:
						thread.start()

				def __synchronizeThreads(self, threads):
					for thread in threads:
						thread.join()

				def __setGigViewerDataListOptions(self):
					def getGigViewerDataListOptionThreads():
						gigViewerDataListOptionThreads = [
							self.createThread(self.parent.setVenueOptions),
							self.createThread(self.parent.setReferenceOptions),
							self.createThread(self.parent.setTelephoneOptions),
							self.createThread(self.parent.setEmailOptions),
						]

						return gigViewerDataListOptionThreads

					gigViewerDataListOptionThreads = getGigViewerDataListOptionThreads()
					
					self.startThreads(gigViewerDataListOptionThreads)

					self.synchronizeThreads(gigViewerDataListOptionThreads)

			return Thread(self)

		def __setVenueOptions(self):
			self.venueOptions = []
			cursor = connection.cursor()

			cursor.execute("SELECT DISTINCT venue FROM GigGuide_gig ORDER BY venue")

			for venue in cursor.fetchall():
				self.venueOptions.append(venue[0])

		def __setReferenceOptions(self):
			self.referenceOptions = []
			cursor = connection.cursor()

			cursor.execute("SELECT DISTINCT reference FROM GigGuide_gig ORDER BY reference")

			for reference in cursor.fetchall():
				reference = reference[0]

				if not self.regex.nothing.match(reference):
					self.referenceOptions.append(reference)

		def __setTelephoneOptions(self):
			self.telephoneOptions = []
			cursor = connection.cursor()

			cursor.execute("SELECT DISTINCT reference, reference_telephone FROM GigGuide_gig ORDER BY reference")

			for result in cursor.fetchall():
				reference = result[0]
				telephone = result[1]

				if not self.regex.nothing.match(reference):
					self.telephoneOptions.append({
						"label": reference,
						"value": telephone,
					})
		
		def __setEmailOptions(self):
			self.emailOptions = []
			cursor = connection.cursor()

			cursor.execute("SELECT DISTINCT reference, reference_email FROM GigGuide_gig ORDER BY reference")

			for result in cursor.fetchall():
				reference = result[0]
				email = result[1]

				if not self.regex.nothing.match(reference):
					self.emailOptions.append({
						"label": reference,
						"value": email,
					})

		def __requestGigsToPublish(self, request):
			self.request = request

			self.__setGigsToPublish()

			return HttpResponse(
				dumps(self.gigsToPublish), 
				content_type = "application/javascript"
			)

		def __setGigsToPublish(self):
			def getGigsToPublish():
				def getGigPublishInfo(gigInfo):
					date = gigInfo[0]
					start = gigInfo[1]
					end = gigInfo[2]
					venue = gigInfo[3]

					gigPublishInfo = {
						"day": self.__getDayName(date.weekday()),
						"date": date.day,
						"month": self.__getMonthName(date.month),
						"start": self.__getFormattedTime(start),
						"end": self.__getFormattedTime(end),
						"venue": venue,
					}

					return gigPublishInfo

				gigsToPublish = []
				cursor = connection.cursor()

				cursor.execute("SELECT date, start, end, venue FROM GigGuide_gig WHERE date >= '%s' ORDER BY date" %self.request.GET["publishWebStartDate"])

				for result in cursor.fetchall():
					gigPublishInfo = getGigPublishInfo(result)
					gigsToPublish.append(gigPublishInfo)

				return gigsToPublish

			gigsToPublish = getGigsToPublish()

			if len(gigsToPublish) > 0:
				self.gigsToPublish = gigsToPublish

		@csrf_exempt
		def __publishWebPage(self, request):
			class WebSite(object):

				def __init__(self, parent):
					self.publish = self.__publish

					self.parent = parent

					self.__baseDirectory = self.__webSiteHtmlPath = self.__webSiteCssPath = self.__webSiteJsPath = \
					self.__webSiteHtmlFile = None

					self.__setPaths();

				def __setPaths(self):
					webSiteBaseDirectory = "JameForbes/Static/JameForbesWebsitTemplate"
					webSiteScriptsDirectory = "Assets/Scripts"
					htmlFile = "jameForbes.html"
					cssFile = "jameForbes.css"
					jsFile = "jameForbes.js"

					self.__baseDirectory = os.path.dirname(os.path.dirname(__file__))
					self.__webSiteHtmlPath = os.path.join(self.__baseDirectory, webSiteBaseDirectory, htmlFile)
					self.__webSiteCssPath = os.path.join(self.__baseDirectory, webSiteBaseDirectory, webSiteScriptsDirectory, cssFile)
					self.__webSiteJsPath = os.path.join(self.__baseDirectory, webSiteBaseDirectory, webSiteScriptsDirectory, jsFile)

				def __addOpeningHtml(self):
					self.__webSiteHtmlFile.write(
						"\n".join([
							"<!doctype html>",
							"<html>",
							"\t<head>",
							"""\t\t<meta charset = "utf-8">"""
					]))

				def __addClosingHtml(self):
					self.__webSiteHtmlFile.write(
						"\n".join([
							"\t</head>",
							"</html>",
					]))

				def __addCss(self):
					self.__webSiteHtmlFile.write("\n\t\t<style>")

					for line in open(self.__webSiteCssPath):
						self.__webSiteHtmlFile.write("".join([
							"\t\t\t",
							line,
						]))

					self.__webSiteHtmlFile.write("\t\t</style>")

				def __addJs(self):
					self.__webSiteHtmlFile.write("\t\t<script>")

					for line in open(self.__webSiteJsPath):
						self.__webSiteHtmlFile.write("\t\t\t")

						if self.parent.regex.gigGuideArticleContents.match(line):
							line = self.parent.regex.gigGuideArticleContents.sub("\\1%s\\2" %self.parent.request.POST["gigGuideTable"], line)

						self.__webSiteHtmlFile.write(line)

					self.__webSiteHtmlFile.write("\t\t</script>")

				def __publish(self):
					self.__webSiteHtmlFile = open(self.__webSiteHtmlPath, "w")

					self.__addOpeningHtml()
					self.__addCss()
					self.__addJs()
					self.__addClosingHtml()

					self.__webSiteHtmlFile.close()

					self.parent.webPagePublicationStatus = "published"

			self.request = request

			webSite = WebSite(self)
			webSite.publish()

			webSitePublicationInfo = {
				"status": self.webPagePublicationStatus,
			}

			return HttpResponse(
				dumps(webSitePublicationInfo), 
				content_type = "application/javascript"
			)

		def __requestGigYears(self, request):
			self.request = request
			
			self.__setGigYears()

			return HttpResponse(
				dumps(self.gigYears), 
				content_type = "application/javascript"
			)

		def __setGigYears(self):
			def getGigYears():
				gigYears = []

				cursor = connection.cursor()

				cursor.execute("SELECT DISTINCT strftime('%Y', date) AS year FROM GigGuide_gig ORDER BY year")

				for record in cursor.fetchall():
					year = int(record[0])

					gigYears.append(year)

				return gigYears

			gigYears = getGigYears()

			if len(gigYears) > 0:
				self.gigYears = gigYears

		@csrf_exempt
		def __exportGigInfoToExcelFormat(self, request):
			class Excel(object):

				def __init__(self, parent):
					self.parent = parent
					self.export = self.__export
					
					self.__cursor = connection.cursor()
					self.__headerRow = self.__getHeaderRow()
					self.__excelFile = Workbook()

					self.__baseDirectory = \
					self.__columnIndex = self.__rowIndex = \
					self.__sheetNames = self.__sheet = None

					self.__setPaths();

				def __setPaths(self):
					self.__baseDirectory = os.path.join(
						os.path.dirname(os.path.dirname(__file__)),
						"JameForbes/Static/AnnualReport",
					)

				def __setCursor(self, year):
					sqlQuery = " ".join([
						"SELECT DISTINCT",
							"date,", # index = 0
							"start,", # index = 1
							"end,", # index = 2
							"venue,", # index = 3
							"invoice,", # index = 4
							"paid,", # index = 5
							"cancelled,", # index = 6
							"reference,", # index = 7
							"reference_telephone,", # index = 8
							"reference_email,", # index = 9
							"notes", # index = 10
						"FROM GigGuide_gig",
						"WHERE strftime('%Y', date) =",
						"'%s' ORDER BY date" %year,
					])

					self.__cursor.execute(sqlQuery)

				def __getHeaderRow(self):
					headerRow = [
						"Date",
						"Start",
						"End",
						"Venue",
						"Invoice",
						"Paid",
						"Cancelled",
						"Reference",
						"Reference Telephone",
						"Reference Email",
						"Notes",
					]

					return headerRow

				def __setHeaderRow(self):
					columnIndex = 0

					for header in self.__headerRow:
						self.__sheet.write(0, columnIndex, header)

						columnIndex += 1

				def __getFormattedRecord(self, record):
					formattedRecord = {
						"Date": self.parent.getFormattedDate(record[0]),
						"Start": self.parent.getFormattedTime(record[1]),
						"End": self.parent.getFormattedTime(record[2]),
						"Venue": record[3],
						"Invoice": record[4],
						"Paid": str(record[5]),
						"Cancelled": str(record[6]),
						"Reference": record[7],
						"Reference Telephone": record[8],
						"Reference Email": record[9],
						"Notes": record[10],
					}

					return formattedRecord

				def __getIndex(self, index):
					if index is None:
						index = 0
					else:
						index += 1

					return index

				def __setSheetName(self, date):
					def initializeSheetNames(monthName):
						if self.__sheetNames is None:
							self.__sheetNames = [
								monthName
							]

							addSheet(monthName)

					def addSheetName(monthName):
						if monthName not in self.__sheetNames:
							self.__sheetNames.append(monthName)

							addSheet(monthName)

					def addSheet(monthName):
						self.__sheet = self.__excelFile.add_sheet(monthName)

						self.__setHeaderRow()

						self.__rowIndex = 1

					monthName = self.parent.getMonthName(date.month)

					initializeSheetNames(monthName)
					addSheetName(monthName)

				def __writeToFile(self, year):
					fileName = "".join([self.__baseDirectory, "/annualGigReport", year, ".xls"])

					for record in self.__cursor.fetchall():
						formattedRecord = self.__getFormattedRecord(record)
						self.__rowIndex = self.__getIndex(self.__rowIndex)

						self.__setSheetName(record[0])

						for header in self.__headerRow:
							self.__columnIndex = self.__getIndex(self.__columnIndex)

							self.__sheet.write(self.__rowIndex, self.__columnIndex, formattedRecord[header])

						self.__columnIndex = None

					self.__rowIndex = None

					self.__excelFile.save(fileName)

					self.parent.excelFiles.append(fileName)

				def __export(self, year):
					self.__setCursor(year)
					self.__writeToFile(year)

			self.excelFiles = []

			for year in request.POST.values():
				excel = Excel(self)
				excel.export(year)

			return HttpResponse(
				dumps(self.excelFiles), 
				content_type = "application/javascript"
			)

		def __openExportedExcelFiles(self, request):
			excelFilesOpened = None

			for excelFile in request.GET.values():
				subprocess.call(('open', excelFile))

			excelFilesOpened = True

			return HttpResponse(
				dumps(excelFilesOpened), 
				content_type = "application/javascript"
			)