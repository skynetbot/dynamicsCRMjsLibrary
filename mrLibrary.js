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
    retrieveMultiple: function (query, options) {
        var promise = new Promise(function(resolve, reject) {
            var optionString = "";
            if (options != null || options != undefined) {
                if (options.charAt(0) != "?") { optionString = "?" + options; }
                else { optionString = options; }
            }
            var xhr = new XMLHttpRequest();
            xhr.open("GET", query + optionString, true);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    xhr.onreadystatechange = null;
                    if (this.status == 200) {
                        var responseData = JSON.parse(this.responseText, mr.crm.dateReviver).d;
                        if (responseData.__next != null) {
                            var nextQuery = responseData.__next.substring((query).length);
                            mr.ajax.retrieveMultiple(query, nextQuery);
                        } /*else { resolve(this.response); }*/
                        resolve(this);
                    } else { reject(this.statusText); }
                }
            };
            xhr.send();
        });
        return promise;
    },
    callback: {
        success: function (data) {
            console.log(1, "success", JSON.parse(data,mr.crm.dateReviver).d);
            //some code for the success callback
            /*
             * //Example:
             * console.log("responseUrl", data.responseURL);
             * var jsonData = JSON.parse(data.responseText, mr.crm.dateReviver).d;
             * //do something with jsonData or:
             * mr.ajax.retrieveMultiple(data.responseURL);
             */
        },
        error: function (data) {
            console.log(2, "error", JSON.parse(data));
            //some code for the error callback
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
/*
 * //Or just
 * mr.ajax.retrieveMultiple("Contacts")
 */
.then(mr.ajax.callback.success)
.catch(mr.ajax.callback.error);
