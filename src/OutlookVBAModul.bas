Sub Synchronize()

    Dim Application As New Outlook.Application
    Dim namespace As Outlook.namespace
    Dim folder As folder
    Dim items As items
    Dim filter As String
    Dim url, data, result As String
    Dim winHttpReq As Object
    Dim isFirst As Boolean
    Dim subject, datee, weekdayy, timee As String
    
    Set Application = CreateObject("Outlook.Application")
    Set namespace = Application.GetNamespace("MAPI")
    
    ' AKTIONEN **********************
    
    Set folder = namespace.GetDefaultFolder(olFolderInbox)
    Set items = folder.items
    
    items.Sort "[ReceivedTime]"
    
    filter = "[Categories] = '4: Actions (private)'"
    Set filteredItems = items.Restrict(filter)
    
    postData = ""
    postData = postData + "{""aktionen"":["
    isFirst = True
    
    For Each item In filteredItems
        If Not isFirst Then
            postData = postData + ","
        End If
        subject = item.subject
        subject = Replace(subject, """", "")
        postData = postData + "{""type"":""aktion"",""title"":"
        postData = postData + """" + subject + """"
        postData = postData + "}"
        isFirst = False
    Next
        
    Set winHttpReq = CreateObject("WinHttp.WinHttpRequest.5.1")
    url = "https://296stkhk5l.execute-api.eu-west-1.amazonaws.com/PROD/aktionen"
            
    postData = postData + "]}"
    Debug.Print postData
    
    winHttpReq.Open "POST", url, False
    winHttpReq.SetRequestHeader "Content-Type", "application/x-www-form-urlencoded"
    winHttpReq.Send (postData)
    result = winHttpReq.responseText
    Debug.Print result
    
    ' TERMINE **********************
    
    Set folder = namespace.GetDefaultFolder(olFolderCalendar)
    Set items = folder.items
    
    items.IncludeRecurrences = True
    items.Sort "[Start]"
    
    Dim yearInteger, monthInteger, dayInteger As Integer
    Dim fromDate, toDate As Date
    Dim dateStringFrom, dateStringTo As String
    
    fromDate = Now
    toDate = DateAdd("ww", 1, Now)
           
    yearInteger = dateTime.year(fromDate)
    monthInteger = dateTime.Month(fromDate)
    dayInteger = dateTime.Day(fromDate)
    dateStringFrom = Trim(Str(dayInteger)) + "/" + Trim(Str(monthInteger)) + "/" + Trim(Str(yearInteger))
    
    yearInteger = dateTime.year(toDate)
    monthInteger = dateTime.Month(toDate)
    dayInteger = dateTime.Day(toDate)
    dateStringTo = Trim(Str(dayInteger)) + "/" + Trim(Str(monthInteger)) + "/" + Trim(Str(yearInteger))
    
    filter = "[Start] > '" + dateStringFrom + "'" + " AND " + "[Start] < '" + dateStringTo + "'"
    Set filteredItems = items.Restrict(filter)
    
    postData = ""
    postData = postData + "{""termine"":["
    isFirst = True
    
    For Each item In filteredItems
        If Not isFirst Then
            postData = postData + ","
        End If
        subject = item.subject
        subject = Replace(subject, """", "")
        datee = Format$(item.start, "yyyymmddHhNn")
        weekdayy = Format$(item.start, "dddd")
        timee = Format$(item.start, "Short Time")
        postData = postData + "{""type"":""termin"","
        postData = postData + """title"":""" + subject + ""","
        postData = postData + """date"":""" + datee + ""","
        postData = postData + """weekday"":""" + weekdayy + ""","
        postData = postData + """time"":""" + timee + """"
        postData = postData + "}"
        isFirst = False
    Next
    
    Set winHttpReq = CreateObject("WinHttp.WinHttpRequest.5.1")
    url = "https://296stkhk5l.execute-api.eu-west-1.amazonaws.com/PROD/termine"
            
    postData = postData + "]}"
    Debug.Print postData
    
    winHttpReq.Open "POST", url, False
    winHttpReq.SetRequestHeader "Content-Type", "application/x-www-form-urlencoded"
    winHttpReq.Send (postData)
    result = winHttpReq.responseText
    Debug.Print result
    
End Sub