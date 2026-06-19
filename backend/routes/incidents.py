import logging
from flask import Blueprint, jsonify
from models.incidents import Incident
from models.predictions import Prediction

logger = logging.getLogger(__name__)
incidents_bp = Blueprint("incidents", __name__)

@incidents_bp.route("/incidents/active", methods=["GET"])
def get_active_incidents():
    try:
        # Fetch incidents that are not closed, cancelled, or resolved
        active_incidents = Incident.query.filter(
            Incident.status.notin_(["CLOSED", "CANCELLED", "RESOLVED"])
        ).order_by(Incident.created_at.desc()).all()
        
        results = []
        for inc in active_incidents:
            data = inc.to_dict()
            # Attach priority if available
            if inc.prediction:
                data["predicted_priority"] = inc.prediction.predicted_priority
            else:
                data["predicted_priority"] = "P4" # Default
            results.append(data)
            
        return jsonify(results), 200
    except Exception as e:
        logger.exception("Failed to fetch active incidents")
        return jsonify({"error": "INTERNAL_ERROR", "message": str(e)}), 500
