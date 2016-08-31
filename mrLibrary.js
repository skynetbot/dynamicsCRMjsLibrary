/*
 * Author:      Milton Reyes
 * Description: A Microsoft Dynamics CRM JavaScript Library
 */
 var mr = { __namespace: true };
 mr.crm = {
     context: function () {
         if (typeof GetGlobalContext != "undefined") { return GetGlobalContext(); } else {
             if (typeof Xrm != "undefined") { return Xrm.Page.context; } else {
                 throw new Error("No context.");
             }
         }
     },
     getClientUrl: function () {
         var clientUrl = this.context().getClientUrl();
         return clientUrl;
     },
     oDataUrl: function () {
         return this.getClientUrl() + "/XRMServices/2011/OrganizationData.svc/";
     },
     dateReviver: function (key, value) {
         var a;
         if (typeof value === 'string') {
             a = /Date\(([-+]?\d+)\)/.exec(value);
             if (a) { return new Date(parseInt(value.replace("/Date(", "").replace(")/", ""), 10)); }
         }
         return value;
     },
     formId: function () {
         return Xrm.Page.data.entity.getId().replace("{", "").replace("}", "");
     }
 };
mr.ajax = {
    qString: function (type, id, relationship) {
        var query = mr.crm.oDataUrl() + type + "Set";
        if (id != null) {
            query += "(guid'"+ id +"')";
            if (relationship != null) {
                query += "/" + relationship;
            }
        }
        return encodeURI(query);
    },
    retrieveMultiple: function (query) {
        var promise = new Promise(function(resolve, reject) {
            /*var optionString = "";
            if (options != null) {
                if (options.charAt(0) != "?") { optionString = "?" + options; }
                else { optionString = options; }
            }*/
            var xhr = new XMLHttpRequest();
            xhr.open("GET", query, true);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    xhr.onreadystatechange = null;
                    if (this.status == 200) {
                        var responseData = JSON.parse(this.resoponseText, mr.crm.dateReviver).d;
                        if (responseData.__next != null) {
                            var nextQuery = responseData.__next.substring((query).length);
                            mr.ajax.retrieveMultiple(query + nextQuery);
                        } else { resolve(this.response); }
                    } else { reject(this.statusText); }
                }
            };
            xhr.send();
        });
        return promise;
    },
    callback: {
        success: function (data, successCallback) {
            console.log(1, "success", JSON.parse(data,mr.crm.dateReviver).d);
            successCallback;
        },
        error: function (data, errorCallback) {
            console.log(2, "error", JSON.parse(data));
            errorCallback;
        }
    }
};
/*
 * Example:
 */
mr.ajax.retrieveMultiple(mr.ajax.qString(
    "Account",
    mr.crm.formId(),
    "account_relationship_name"
))
.then(mr.ajax.callback.success(
    data,
    function() {
        //some code for the success callback
    }
))
.catch(mr.ajax.callback.error(
    data,
    function () {
        //some code for the error callback
    }
));
